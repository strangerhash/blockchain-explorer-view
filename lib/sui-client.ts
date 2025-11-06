// Try different import paths based on @mysten/sui.js version
// For v0.56.0+, use: import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
// For older versions, use: import { JsonRpcProvider, mainnetConnection } from '@mysten/sui.js';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';

// Initialize Sui client - defaults to mainnet, can be configured via env
const getRpcUrl = (): string => {
  // In Next.js, NEXT_PUBLIC_* variables are available on both client and server
  const customUrl = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUI_RPC_URL;
  return customUrl || getFullnodeUrl('mainnet');
};

export const suiClient = new SuiClient({ url: getRpcUrl() });

export interface TransactionExplanation {
  summary: string;
  actions: TransactionAction[];
  gasUsed: string;
  gasPrice: string;
  totalGasCost: string;
  objectsCreated: number;
  objectsTransferred: number;
  objectsMutated: number;
  involvedAddresses: string[];
  moveCalls: MoveCallInfo[];
  timestamp?: string; // ISO timestamp string
  timestampFormatted?: string; // Human-readable timestamp
  aiEnhanced?: boolean;
  aiInsights?: string[];
  aiRisks?: string[];
  aiStatus?: 'enabled' | 'disabled' | 'timeout' | 'error' | 'no_key';
  aiStatusMessage?: string;
  balanceChanges?: Array<{
    address: string;
    amount: string;
    coinType: string;
    change: 'increase' | 'decrease';
    accountName?: string;
    explanation?: string; // What this balance change means
  }>;
  accountNames?: Map<string, string>;
}

export interface TransactionAction {
  type: 'transfer' | 'create' | 'mutate' | 'call';
  description: string;
  from?: string;
  to?: string;
  amount?: string;
  token?: string;
  objectId?: string;
}

export interface MoveCallInfo {
  package: string;
  module: string;
  function: string;
  arguments: any[];
}

// Default Blockberry API key - can be overridden by environment variable BLOCKBERRY_API_KEY
const DEFAULT_BLOCKBERRY_API_KEY = 'LqFsv1GGYsa7hcHvQye19fquqCWAh2';

/**
 * Fetches transaction details from Blockberry API
 */
export async function fetchTransaction(digest: string) {
  try {
    // Priority: Environment variable > Default key
    const apiKey = process.env.BLOCKBERRY_API_KEY || DEFAULT_BLOCKBERRY_API_KEY;
    const url = `https://api.blockberry.one/sui/v1/raw-transactions/${digest}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Blockberry API returns: { id, jsonrpc, result: { digest, transaction, effects, ... } }
    // Normalize to match Sui SDK format
    if (data.result) {
      return {
        ...data.result,
        transaction: data.result.transaction,
        effects: data.result.effects,
        events: data.result.events,
        objectChanges: data.result.objectChanges,
        balanceChanges: data.result.balanceChanges,
      };
    }
    
    return data;
  } catch (error) {
    // Fallback to Sui RPC if Blockberry API fails
    try {
      console.warn('Blockberry API failed, falling back to Sui RPC:', error);
      const tx = await suiClient.getTransactionBlock({
        digest,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showBalanceChanges: true,
        },
      });
      return tx;
    } catch (fallbackError) {
      throw new Error(`Failed to fetch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Cache for account names to avoid repeated API calls
const accountNameCache = new Map<string, string>();

/**
 * Fetches account name from Blockberry API
 */
async function getAccountName(address: string): Promise<string | null> {
  // Return cached name if available
  if (accountNameCache.has(address)) {
    return accountNameCache.get(address) || null;
  }

  try {
    // Priority: Environment variable > Default key
    const apiKey = process.env.BLOCKBERRY_API_KEY || DEFAULT_BLOCKBERRY_API_KEY;
    const url = `https://api.blockberry.one/sui/v1/accounts/${address}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Accept': '*/*',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const accountName = data.accountName || null;
      if (accountName) {
        accountNameCache.set(address, accountName);
        return accountName;
      }
    }
  } catch (error) {
    // Silently fail - we'll use address instead
    console.debug(`Failed to fetch account name for ${address}:`, error);
  }

  return null;
}

/**
 * Analyzes transaction and generates human-readable explanation
 */
export async function explainTransaction(transaction: any): Promise<TransactionExplanation> {
  const actions: TransactionAction[] = [];
  const involvedAddresses = new Set<string>();
  let objectsCreated = 0;
  let objectsTransferred = 0;
  let objectsMutated = 0;
  const moveCalls: MoveCallInfo[] = [];

  // Extract gas information - handle both Sui SDK and Blockberry API formats
  const effects = transaction.effects || transaction.effect;
  const gasUsed = effects?.gasUsed?.computationCost || effects?.gasUsed?.computationCost || '0';
  const gasPrice = effects?.gasUsed?.gasPrice || effects?.gasUsed?.gasPrice || '0';
  const storageCost = effects?.gasUsed?.storageCost || '0';
  const storageRebate = effects?.gasUsed?.storageRebate || '0';
  const nonRefundable = effects?.gasUsed?.nonRefundableStorageFee || '0';
  const totalGasCost = effects?.gasUsed?.totalCost || 
    (Number(gasUsed) + Number(storageCost) - Number(storageRebate) + Number(nonRefundable)).toString();

  // Get sender from transaction data (needed for transfer matching)
  const sender = transaction.transaction?.data?.sender || 
                 transaction.transaction?.sender || 
                 transaction.sender || '';

  // Fetch sender account name immediately
  const accountNames = new Map<string, string>();
  if (sender) {
    involvedAddresses.add(sender);
    const senderName = await getAccountName(sender);
    if (senderName) {
      accountNames.set(sender, senderName);
    }
  }

  // Collect receiver addresses from balance changes
  const receiverAddresses = new Set<string>();

  // Process object changes
  if (transaction.objectChanges) {
    for (const change of transaction.objectChanges) {
      if (change.type === 'created') {
        objectsCreated++;
        actions.push({
          type: 'create',
          description: `New object created: ${change.objectId.substring(0, 16)}...`,
          objectId: change.objectId,
        });
      } else if (change.type === 'transferred') {
        objectsTransferred++;
        const recipient = change.recipient?.AddressOwner || 
                         change.recipient?.ObjectOwner || 
                         change.owner?.AddressOwner ||
                         change.owner?.ObjectOwner ||
                         'Unknown';
        const senderAddr = change.sender || sender;
        
        if (recipient !== 'Unknown') {
          involvedAddresses.add(recipient);
          receiverAddresses.add(recipient);
        }
        if (senderAddr) {
          involvedAddresses.add(senderAddr);
        }
        
        // Try to identify if it's a token transfer
        const objectType = change.objectType || '';
        if (objectType.includes('Coin') || objectType.includes('Token')) {
          const amount = extractAmount(change);
          // Get display names for description
          const senderDisplay = senderAddr ? getDisplayName(senderAddr, accountNames) : null;
          const receiverDisplay = getDisplayName(recipient, accountNames);
          
          actions.push({
            type: 'transfer',
            description: senderAddr 
              ? `Transferred ${amount || 'token'} from ${senderDisplay?.display || shortAddress(senderAddr)} to ${receiverDisplay.display}`
              : `Transferred ${amount || 'token'} to ${receiverDisplay.display}`,
            from: senderAddr,
            to: recipient,
            amount: amount,
            token: objectType,
          });
        } else {
          actions.push({
            type: 'transfer',
            description: senderAddr
              ? `Object transferred from ${shortAddress(senderAddr)} to ${shortAddress(recipient)}`
              : `Object transferred to ${shortAddress(recipient)}`,
            from: senderAddr,
            to: recipient,
            objectId: change.objectId,
          });
        }
      } else if (change.type === 'mutated') {
        objectsMutated++;
        actions.push({
          type: 'mutate',
          description: `Object mutated: ${change.objectId.substring(0, 16)}...`,
          objectId: change.objectId,
        });
      }
    }
  }

  // Process balance changes - these show actual token movements
  // Match senders and recipients to create proper transfer pairs
  if (transaction.balanceChanges) {
    const senders: Array<{ address: string; amount: number }> = [];
    const recipients: Array<{ address: string; amount: number }> = [];
    
    for (const balanceChange of transaction.balanceChanges) {
      const owner = balanceChange.owner?.AddressOwner || 
                    balanceChange.owner?.ObjectOwner;
      
      if (!owner || balanceChange.owner?.Shared) continue;
      
      involvedAddresses.add(owner);
      const amountMist = typeof balanceChange.amount === 'string' 
        ? parseFloat(balanceChange.amount) 
        : balanceChange.amount;
      
      if (amountMist > 0) {
        recipients.push({ address: owner, amount: amountMist });
        receiverAddresses.add(owner); // Track receiver addresses
      } else if (amountMist < 0) {
        senders.push({ address: owner, amount: Math.abs(amountMist) });
      }
    }
    
    // Try to match sends and receives
    const matched = new Set<number>();
    for (let i = 0; i < senders.length; i++) {
      for (let j = 0; j < recipients.length; j++) {
        if (matched.has(j)) continue;
        // Match if amounts are close (within 1% for rounding)
        const amountDiff = Math.abs(senders[i].amount - recipients[j].amount) / senders[i].amount;
        if (amountDiff < 0.01) {
          const senderDisplay = getDisplayName(senders[i].address, accountNames);
          const receiverDisplay = getDisplayName(recipients[j].address, accountNames);
          actions.push({
            type: 'transfer',
            description: `Transferred ${formatAmount(senders[i].amount)} from ${senderDisplay.display} to ${receiverDisplay.display}`,
            from: senders[i].address,
            to: recipients[j].address,
            amount: formatAmount(senders[i].amount),
          });
          matched.add(j);
          break;
        }
      }
    }
    
    // Add unmatched sends
    for (let i = 0; i < senders.length; i++) {
      const matchedRecipient = recipients.find((r, idx) => !matched.has(idx) && 
        Math.abs(senders[i].amount - r.amount) / senders[i].amount < 0.01);
      
      if (!matchedRecipient) {
        const senderDisplay = getDisplayName(senders[i].address, accountNames);
        actions.push({
          type: 'transfer',
          description: `${senderDisplay.display} sent ${formatAmount(senders[i].amount)}`,
          from: senders[i].address,
          amount: formatAmount(senders[i].amount),
        });
      }
    }
    
    // Add unmatched receives
    for (let j = 0; j < recipients.length; j++) {
      if (!matched.has(j)) {
        const fromAddr = sender || undefined;
        const receiverDisplay = getDisplayName(recipients[j].address, accountNames);
        const fromDisplay = fromAddr ? getDisplayName(fromAddr, accountNames) : null;
        actions.push({
          type: 'transfer',
          description: `${receiverDisplay.display} received ${formatAmount(recipients[j].amount)}${fromDisplay ? ` from ${fromDisplay.display}` : ''}`,
          from: fromAddr,
          to: recipients[j].address,
          amount: formatAmount(recipients[j].amount),
        });
      }
    }
  }

  // Process Move calls - handle both formats
  const txData = transaction.transaction?.data?.transaction || transaction.transaction || {};
  const transactions = txData.transactions || [];
  
  for (const tx of transactions) {
    if (tx.MoveCall) {
      const call = tx.MoveCall;
      moveCalls.push({
        package: call.package,
        module: call.module,
        function: call.function,
        arguments: call.arguments || [],
      });
    }
  }

  // Fetch account names for receiver addresses (sender already fetched)
  const receiverAddressArray = Array.from(receiverAddresses);
  
  // Fetch receiver account names in parallel (limit to 10 to avoid too many API calls)
  const receiverPromises = receiverAddressArray.slice(0, 10).map(async (addr) => {
    const name = await getAccountName(addr);
    if (name) {
      accountNames.set(addr, name);
    }
  });
  
  await Promise.all(receiverPromises);

  // Collect balance changes for display
  const balanceChanges: Array<{
    address: string;
    amount: string;
    coinType: string;
    change: 'increase' | 'decrease';
    accountName?: string;
    explanation?: string;
  }> = [];

  if (transaction.balanceChanges) {
    for (const balanceChange of transaction.balanceChanges) {
      const owner = balanceChange.owner?.AddressOwner || balanceChange.owner?.ObjectOwner;
      if (!owner || balanceChange.owner?.Shared) continue;

      const amountMist = typeof balanceChange.amount === 'string' 
        ? parseFloat(balanceChange.amount) 
        : balanceChange.amount;
      
      if (amountMist !== 0) {
        const accountName = accountNames.get(owner);
        const displayName = accountName || `${owner.substring(0, 8)}...${owner.substring(owner.length - 6)} (account name not available)`;
        const changeType = amountMist > 0 ? 'increase' : 'decrease';
        const explanation = amountMist > 0 
          ? `${displayName} received ${formatAmount(Math.abs(amountMist))} ${balanceChange.coinType || 'SUI'}`
          : `${displayName} sent ${formatAmount(Math.abs(amountMist))} ${balanceChange.coinType || 'SUI'}`;
        
        balanceChanges.push({
          address: owner,
          amount: formatAmount(Math.abs(amountMist)),
          coinType: balanceChange.coinType || 'SUI',
          change: changeType,
          accountName: accountName,
          explanation,
        });
      }
    }
  }

  // Extract timestamp with proper validation
  let timestamp: string | undefined;
  let timestampFormatted: string | undefined;
  
  try {
    if (transaction.timestampMs) {
      const date = new Date(transaction.timestampMs);
      if (!isNaN(date.getTime())) {
        timestamp = date.toISOString();
        timestampFormatted = date.toLocaleString();
      }
    } else if (transaction.effects?.timestampMs) {
      const date = new Date(transaction.effects.timestampMs);
      if (!isNaN(date.getTime())) {
        timestamp = date.toISOString();
        timestampFormatted = date.toLocaleString();
      }
    } else if (transaction.timestamp) {
      // Try parsing as string timestamp
      const date = new Date(transaction.timestamp);
      if (!isNaN(date.getTime())) {
        timestamp = date.toISOString();
        timestampFormatted = date.toLocaleString();
      }
    }
  } catch (error) {
    console.error('Error parsing timestamp:', error);
    // Leave timestamp undefined if parsing fails
  }

  // Generate summary with account names
  const summary = await generateSummary(actions, objectsCreated, objectsTransferred, objectsMutated, moveCalls, accountNames, formatGas(totalGasCost), balanceChanges);

  return {
    summary,
    actions,
    gasUsed: formatGas(gasUsed),
    gasPrice: formatGas(gasPrice),
    totalGasCost: formatGas(totalGasCost),
    objectsCreated,
    objectsTransferred,
    objectsMutated,
    involvedAddresses: Array.from(involvedAddresses),
    moveCalls,
    timestamp,
    timestampFormatted,
    balanceChanges,
    accountNames, // Export account names map for UI
  };
}

async function generateSummary(
  actions: TransactionAction[],
  created: number,
  transferred: number,
  mutated: number,
  moveCalls: MoveCallInfo[],
  accountNames: Map<string, string>,
  gasCost: string,
  balanceChanges: Array<{
    address: string;
    amount: string;
    coinType: string;
    change: 'increase' | 'decrease';
    accountName?: string;
    explanation?: string;
  }> = []
): Promise<string> {
  const parts: string[] = [];

  // Detect transaction type from Move calls
  const swapCalls = moveCalls.filter(c => c.function === 'swap' || c.module === 'swap');
  const isSwap = swapCalls.length > 0;
  
  // Detect router pattern (multiple swaps)
  const routerCalls = moveCalls.filter(c => c.module === 'router');
  const isMultiSwap = routerCalls.length > 0 && swapCalls.length > 1;
  
  // Detect oracle/price updates
  const pythCalls = moveCalls.filter(c => c.module === 'pyth' || c.package?.includes('pyth'));
  const isOracleUpdate = pythCalls.length > 0;
  
  // Detect VAA/Cross-chain
  const vaaCalls = moveCalls.filter(c => c.module === 'vaa');
  const isCrossChain = vaaCalls.length > 0;

  // Main transfer actions - match MVP requirement format: "Alice transferred Stablecoin OR Token #1234 to Bob"
  const transfers = actions.filter(a => a.type === 'transfer' && a.from && a.to);
  
  // Determine transaction type and format according to MVP requirements
  if (isOracleUpdate) {
    parts.push(`Updated ${pythCalls.length} price feed${pythCalls.length > 1 ? 's' : ''} via Pyth oracle${isCrossChain ? ' (cross-chain data)' : ''}`);
  } else if (isMultiSwap) {
    parts.push(`Executed ${swapCalls.length} token swaps through a DEX aggregator`);
  } else if (isSwap) {
    parts.push(`Executed a token swap`);
  } else if (transfers.length > 0) {
    // Format according to MVP: "Alice (0x1234...) transferred Stablecoin OR Token #1234 to Bob (0x5678...)"
    for (const transfer of transfers.slice(0, 3)) {
      const senderInfo = getDisplayName(transfer.from || '', accountNames);
      const receiverInfo = getDisplayName(transfer.to || '', accountNames);
      const tokenType = transfer.token ? 
        (transfer.token.includes('Coin<') ? extractTokenType(transfer.token) : 'Token') : 
        'Token';
      const tokenId = transfer.objectId ? ` #${transfer.objectId.substring(0, 8)}` : '';
      
      if (transfer.amount) {
        parts.push(`${senderInfo.display} transferred ${transfer.amount} ${tokenType}${tokenId} to ${receiverInfo.display}`);
      } else {
        parts.push(`${senderInfo.display} transferred ${tokenType}${tokenId} to ${receiverInfo.display}`);
      }
    }
    
    if (transfers.length > 3) {
      parts.push(`... and ${transfers.length - 3} more transfer${transfers.length - 3 > 1 ? 's' : ''}`);
    }
  }

  // Object creation - match MVP requirement: "2 new objects were created."
  if (created > 0) {
    parts.push(`${created} new object${created > 1 ? 's were' : ' was'} created`);
  }

  // Gas usage - match MVP requirement: "Gas used: 0.015 SUI"
  if (gasCost && gasCost !== '0 SUI' && gasCost !== '0 MIST') {
    parts.push(`Gas used: ${gasCost}`);
  }

  // Balance changes - create a clear summary of net changes per account
  if (balanceChanges.length > 0) {
    // Group balance changes by account
    const accountBalances = new Map<string, Array<{ amount: string; coinType: string; change: 'increase' | 'decrease' }>>();
    
    for (const change of balanceChanges) {
      if (!accountBalances.has(change.address)) {
        accountBalances.set(change.address, []);
      }
      accountBalances.get(change.address)!.push({
        amount: change.amount,
        coinType: change.coinType,
        change: change.change,
      });
    }
    
    // Summarize for each account
    const balanceSummaries: string[] = [];
    for (const [address, changes] of Array.from(accountBalances.entries()).slice(0, 5)) {
      const accountInfo = getDisplayName(address, accountNames);
      const sent: Array<{ amount: string; coinType: string }> = [];
      const received: Array<{ amount: string; coinType: string }> = [];
      
      for (const change of changes) {
        if (change.change === 'increase') {
          received.push({ amount: change.amount, coinType: change.coinType });
        } else {
          sent.push({ amount: change.amount, coinType: change.coinType });
        }
      }
      
      // Create concise summary for this account
      const accountSummary: string[] = [];
      if (sent.length > 0) {
        const sentTokens = sent.map(s => `${s.amount} ${s.coinType.includes('SUI') ? 'SUI' : 'tokens'}`).join(' and ');
        accountSummary.push(`sent ${sentTokens}`);
      }
      if (received.length > 0) {
        const receivedTokens = received.map(r => `${r.amount} ${r.coinType.includes('SUI') ? 'SUI' : 'tokens'}`).join(' and ');
        accountSummary.push(`received ${receivedTokens}`);
      }
      
      if (accountSummary.length > 0) {
        balanceSummaries.push(`${accountInfo.display} ${accountSummary.join(' and ')}`);
      }
    }
    
    if (balanceSummaries.length > 0) {
      // If it's a swap, describe it more naturally
      if (isSwap && balanceSummaries.length === 1) {
        const summary = balanceSummaries[0];
        // Extract the account name and describe the swap
        const match = summary.match(/^(.+?)\s+(sent.+?and received.+?)$/);
        if (match) {
          parts.push(`${match[1]} exchanged ${match[2].replace('sent ', '').replace(' and received ', ' for ')}`);
        } else {
          parts.push(summary);
        }
      } else {
        parts.push(balanceSummaries.join(', '));
      }
    }
    
    if (accountBalances.size > 5) {
      parts.push(`... and ${accountBalances.size - 5} more account${accountBalances.size - 5 > 1 ? 's' : ''} with balance changes`);
    }
  }

  // Object mutations (for swaps and oracle updates, this is normal)
  if (mutated > 0 && !isSwap && !isOracleUpdate) {
    parts.push(`${mutated} object${mutated > 1 ? 's were' : ' was'} modified`);
  }

  // Move calls - provide clear labels as per MVP requirement
  if (moveCalls.length > 0 && !isSwap && !isOracleUpdate) {
    const uniquePackages = [...new Set(moveCalls.map(c => shortAddress(c.package)))];
    if (uniquePackages.length <= 3) {
      parts.push(`Called Move functions from package${uniquePackages.length > 1 ? 's' : ''}: ${uniquePackages.join(', ')}`);
    } else {
      parts.push(`Executed ${moveCalls.length} Move function call${moveCalls.length > 1 ? 's' : ''} from ${uniquePackages.length} package${uniquePackages.length > 1 ? 's' : ''}`);
    }
  }

  return parts.join('. ') || 'Transaction executed successfully';
}

function extractTokenType(tokenString: string): string {
  // Extract token type from strings like "Coin<0x2::sui::SUI>" or "Coin<0x123::token::TOKEN>"
  const match = tokenString.match(/Coin<[^>]+::([^:>]+)>/);
  if (match) {
    const tokenName = match[1];
    // Capitalize first letter
    return tokenName.charAt(0).toUpperCase() + tokenName.slice(1);
  }
  
  // Check for common token names
  if (tokenString.includes('SUI')) return 'SUI';
  if (tokenString.includes('USDC')) return 'USDC';
  if (tokenString.includes('USDT')) return 'USDT';
  if (tokenString.includes('Stablecoin')) return 'Stablecoin';
  
  return 'Token';
}

function getDisplayName(address: string, accountNames: Map<string, string>): { display: string; hasName: boolean; address: string; fullDisplay: string } {
  const name = accountNames.get(address);
  const shortAddr = shortAddress(address);
  if (name) {
    return { 
      display: `${name} (${shortAddr})`, 
      hasName: true, 
      address,
      fullDisplay: `${name} (${address})`
    };
  }
  return { 
    display: `${shortAddr} (account name not available)`, 
    hasName: false, 
    address,
    fullDisplay: `${shortAddr} (${address})`
  };
}

function shortAddress(address: string): string {
  if (!address) return 'Unknown';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function formatAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (num === 0) return '0 SUI';
  
  // If amount is large (likely in MIST), convert to SUI
  // MIST amounts are typically 9+ digits, SUI amounts are typically smaller
  if (num >= 1_000_000) {
    const sui = num / 1_000_000_000;
    if (sui >= 0.000001) {
      if (sui >= 1) {
        return `${sui.toLocaleString(undefined, { maximumFractionDigits: 2 })} SUI`;
      } else {
        return `${sui.toFixed(6)} SUI`;
      }
    }
  }
  
  // For smaller amounts, show as-is
  if (num < 0.000001) return num.toExponential(2);
  return num.toLocaleString(undefined, { maximumFractionDigits: 9 });
}

function formatGas(gas: string | number): string {
  const num = typeof gas === 'string' ? parseFloat(gas) : gas;
  // Convert MIST to SUI (1 SUI = 1,000,000,000 MIST)
  const sui = num / 1_000_000_000;
  if (sui < 0.000001) return `${num} MIST`;
  return `${sui.toFixed(9)} SUI`;
}

function extractAmount(change: any): string | undefined {
  // Try to extract amount from object data
  if (change.amount) return formatAmount(change.amount);
  return undefined;
}
