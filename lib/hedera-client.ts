/**
 * Hedera blockchain client for fetching transaction data
 * Uses Hedera Mirror Node REST API
 */

export type Blockchain = 'hedera' | 'sui';

export interface HederaTransaction {
  transaction_id: string;
  consensus_timestamp: string;
  transaction_hash: string;
  node: string;
  transaction_fee: string;
  transfers: Array<{
    account: string;
    amount: number;
    is_approval?: boolean;
  }>;
  token_transfers?: Array<{
    token_id: string;
    account: string;
    amount: number;
    decimals: number;
  }>;
  name: string;
  result: string;
  charged_tx_fee: number;
  memo?: string;
}

export interface HederaAccount {
  account: string;
  alias?: string;
  evm_address?: string;
  balance: {
    balance: number;
    timestamp: string;
    tokens?: Array<{
      token_id: string;
      balance: number;
    }>;
  };
  key?: {
    key: string;
    type: string;
  };
  memo?: string;
}

export interface HederaToken {
  token_id: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  type?: string;
}

export interface TokenTransfer {
  token_id: string;
  account: string;
  amount: number;
  decimals?: number;
  is_approval?: boolean;
}

// Default Hedera API key - can be overridden by environment variable HEDERA_API_KEY
const DEFAULT_HEDERA_API_KEY = 'v4.public.eyJzdWIiOiI5NjQ5MjY2Mi1iOTQxLTExZjAtYjhhYy05MzdkZjE1MTBmZTgiLCJpYXQiOiIyMDI1LTExLTA2VDEwOjIxOjI0LjE2NFoiLCJqdGkiOiI1OGI5YWJiOC1iYWZhLTExZjAtODk0NS00M2ZlMjBjNmU1MGUiffSrHGvBAn2Y_3uzG6Yxb-KawMgC48GmpqMM8nDD_7FxP-eCT3HT2T_okx-hF2OsjgZYlpqNnMi0SkBPXij4ZAg';

/**
 * Fetches transaction from Hedera Mirror Node API
 */
export async function fetchHederaTransaction(transactionId: string): Promise<any> {
  try {
    // Priority: Environment variable > Default key
    const apiKey = process.env.HEDERA_API_KEY || DEFAULT_HEDERA_API_KEY;
    
    // Hedera transaction ID format: 0.0.123-1234567890-123456789 or 0.0.123@1234567890.123456789
    // Or just the hash
    let url: string;
    
    // Normalize transaction ID format (replace @ with -)
    const normalizedId = transactionId.replace('@', '-');
    
    // Check if it's a transaction ID format (0.0.x-y-z) or a hash
    if (normalizedId.includes('-') && normalizedId.split('-').length === 3) {
      // Transaction ID format
      url = `https://mainnet-public.mirrornode.hedera.com/api/v1/transactions/${normalizedId}`;
    } else {
      // Try as transaction hash
      url = `https://mainnet-public.mirrornode.hedera.com/api/v1/transactions/${normalizedId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      // Try alternative endpoint or format
      if (response.status === 404) {
        // Try searching by hash
        const apiKey = process.env.HEDERA_API_KEY || DEFAULT_HEDERA_API_KEY;
        const hashUrl = `https://mainnet-public.mirrornode.hedera.com/api/v1/transactions?transactionhash=${transactionId}`;
        const hashResponse = await fetch(hashUrl, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        if (hashResponse.ok) {
          const hashData = await hashResponse.json();
          if (hashData.transactions && hashData.transactions.length > 0) {
            const txId = hashData.transactions[0].transaction_id;
            return fetchHederaTransaction(txId);
          }
        }
      }
      throw new Error(`Hedera API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Normalize to common format
    // API might return { transactions: [...] } or a single transaction object
    if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
      return normalizeHederaTransaction(data.transactions[0]);
    }
    
    // If it's a single transaction object
    if (data.transaction_id || data.consensus_timestamp) {
      return normalizeHederaTransaction(data);
    }
    
    // Fallback: try to normalize whatever we got
    return normalizeHederaTransaction(data);
  } catch (error) {
    console.error('Error fetching Hedera transaction:', error);
    throw error;
  }
}

/**
 * Fetches account information from Hedera Mirror Node API
 */
export async function getHederaAccountName(accountId: string): Promise<string | null> {
  try {
    // Priority: Environment variable > Default key
    const apiKey = process.env.HEDERA_API_KEY || DEFAULT_HEDERA_API_KEY;
    
    const url = `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${accountId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: HederaAccount = await response.json();
    
    // Return alias if available, otherwise return account ID
    if (data.alias) {
      return data.alias;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Hedera account:', error);
    return null;
  }
}

/**
 * Fetches token information from Hedera Mirror Node API
 */
export async function getHederaTokenInfo(tokenId: string): Promise<{ symbol?: string; name?: string; decimals?: number } | null> {
  try {
    // Priority: Environment variable > Default key
    const apiKey = process.env.HEDERA_API_KEY || DEFAULT_HEDERA_API_KEY;
    
    const url = `https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/${tokenId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: HederaToken = await response.json();
    
    return {
      symbol: data.symbol,
      name: data.name,
      decimals: data.decimals,
    };
  } catch (error) {
    console.error('Error fetching Hedera token info:', error);
    return null;
  }
}

/**
 * Parses Hedera timestamp to milliseconds
 */
function parseHederaTimestamp(timestamp: string): number | undefined {
  try {
    // Hedera timestamp format: "1234567890.123456789" (seconds.nanoseconds)
    const parts = timestamp.split('.');
    if (parts.length === 2) {
      const seconds = parseInt(parts[0]);
      const nanos = parseInt(parts[1]);
      return seconds * 1000 + Math.floor(nanos / 1_000_000);
    }
    // Try as ISO string or number
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  } catch (error) {
    console.error('Error parsing Hedera timestamp:', error);
  }
  return undefined;
}

/**
 * Normalizes Hedera transaction to common format
 */
function normalizeHederaTransaction(tx: HederaTransaction | any): any {
  // Handle both single transaction object and transactions array response
  const transaction = (tx as any).transactions?.[0] || tx;
  
  return {
    transaction: {
      data: {
        message: {
          name: transaction.name || transaction.transaction_type || 'TRANSACTION',
          transactionID: transaction.transaction_id,
        },
      },
    },
    effects: {
      status: {
        status: (transaction.result || transaction.status) === 'SUCCESS' ? 'success' : 'failure',
      },
      gasUsed: {
        computationCost: transaction.charged_tx_fee || transaction.transaction_fee || 0,
      },
    },
    balanceChanges: transaction.transfers?.map((transfer: any) => ({
      owner: transfer.account,
      coinType: 'HBAR',
      amount: transfer.amount.toString(),
      change: transfer.amount >= 0 ? 'increase' : 'decrease',
    })) || [],
    events: [],
    objectChanges: [],
    digest: transaction.transaction_hash || transaction.transaction_id,
    timestamp: transaction.consensus_timestamp,
    timestampMs: transaction.consensus_timestamp ? parseHederaTimestamp(transaction.consensus_timestamp) : undefined,
    fee: transaction.charged_tx_fee || transaction.transaction_fee,
    transfers: transaction.transfers || [],
    tokenTransfers: transaction.token_transfers || [],
    name: transaction.name || transaction.transaction_type,
    result: transaction.result || transaction.status,
  };
}

/**
 * Explains a Hedera transaction
 */
export async function explainHederaTransaction(transaction: any): Promise<any> {
  const tx = transaction;
  const transfers = tx.transfers || [];
  const tokenTransfers = tx.tokenTransfers || [];
  const transactionType = tx.name || tx.transaction?.data?.message?.name || 'TRANSACTION';
  
  // Extract involved accounts
  const accounts = new Set<string>();
  transfers.forEach((t: any) => {
    if (t.account) accounts.add(t.account);
  });
  tokenTransfers.forEach((t: any) => {
    if (t.account) accounts.add(t.account);
  });
  
  // Fetch account names
  const accountNames = new Map<string, string>();
  for (const account of accounts) {
    const name = await getHederaAccountName(account);
    if (name) {
      accountNames.set(account, name);
    }
  }
  
  // Fetch token names/symbols and decimals
  const tokenInfo = new Map<string, { symbol?: string; name?: string; decimals?: number }>();
  const uniqueTokenIds = new Set<string>();
  tokenTransfers.forEach((tt: any) => {
    if (tt.token_id) uniqueTokenIds.add(tt.token_id);
  });
  
  for (const tokenId of uniqueTokenIds) {
    const info = await getHederaTokenInfo(tokenId);
    if (info) {
      tokenInfo.set(tokenId, info);
    }
  }
  
  // Enrich token transfers with decimals from token info
  const enrichedTokenTransfers = tokenTransfers.map((tt: any) => {
    const token = tokenInfo.get(tt.token_id);
    return {
      ...tt,
      decimals: tt.decimals || token?.decimals || 8, // Default to 8 if not specified (common for tokens)
    };
  });
  
  // Generate summary
  const summaryParts: string[] = [];
  const actions: any[] = [];
  const balanceChanges: any[] = [];
  
  // Detect transaction type and add to summary
  const isTokenBurn = transactionType.includes('BURN') || transactionType.includes('TOKENBURN');
  const isTokenMint = transactionType.includes('MINT') || transactionType.includes('TOKENMINT');
  const isTokenTransfer = transactionType.includes('TRANSFER') || transactionType.includes('TOKENTRANSFER');
  const isCryptoTransfer = transactionType.includes('CRYPTOTRANSFER') || transactionType.includes('CRYPTO');
  
  // Process HBAR transfers
  if (transfers.length > 0) {
    const hbarTransfers = transfers.filter((t: any) => !t.token_id);
    if (hbarTransfers.length > 0) {
      const sent = hbarTransfers.filter((t: any) => t.amount < 0);
      const received = hbarTransfers.filter((t: any) => t.amount > 0);
      
      if (sent.length > 0 && received.length > 0) {
        const from = sent[0].account;
        const to = received[0].account;
        const amount = Math.abs(sent[0].amount) / 100_000_000; // Convert tinybars to HBAR
        
        const fromName = accountNames.get(from);
        const toName = accountNames.get(to);
        
        const fromDisplay = fromName ? `${fromName} (${from.substring(0, 8)}...${from.substring(from.length - 6)})` : `${from.substring(0, 8)}...${from.substring(from.length - 6)} (account name not available)`;
        const toDisplay = toName ? `${toName} (${to.substring(0, 8)}...${to.substring(to.length - 6)})` : `${to.substring(0, 8)}...${to.substring(to.length - 6)} (account name not available)`;
        
        summaryParts.push(`${fromDisplay} transferred ${amount.toFixed(9)} HBAR to ${toDisplay}`);
        
        actions.push({
          type: 'transfer',
          description: `Transferred ${amount.toFixed(9)} HBAR`,
          from,
          to,
          amount: `${amount.toFixed(9)} HBAR`,
        });
        
        balanceChanges.push({
          address: from,
          amount: amount.toFixed(9),
          coinType: 'HBAR',
          change: 'decrease',
          accountName: fromName,
        });
        
        balanceChanges.push({
          address: to,
          amount: amount.toFixed(9),
          coinType: 'HBAR',
          change: 'increase',
          accountName: toName,
        });
      }
    }
  }
  
  // Process token transfers with more detail
  if (enrichedTokenTransfers.length > 0) {
    // Group by token ID
    const tokenGroups = new Map<string, Array<{ account: string; amount: number; decimals: number }>>();
    
    enrichedTokenTransfers.forEach((tt: any) => {
      const tokenId = tt.token_id || 'UNKNOWN';
      if (!tokenGroups.has(tokenId)) {
        tokenGroups.set(tokenId, []);
      }
      tokenGroups.get(tokenId)!.push({
        account: tt.account,
        amount: tt.amount,
        decimals: tt.decimals || 8, // Default to 8 decimals for tokens
      });
    });
    
    // Process each token
    for (const [tokenId, transfers] of tokenGroups.entries()) {
      const sent = transfers.filter(t => t.amount < 0);
      const received = transfers.filter(t => t.amount > 0);
      
      // Check for burn: look for BURN account or if transaction type is BURN
      // BURN account can be "BURN", "0.0.0", or any account receiving positive amount when type is BURN
      // Also check if any received account is a burn address
      const burnAccount = received.find(t => 
        t.account === 'BURN' || 
        t.account === '0.0.0' || 
        (isTokenBurn && t.account && t.account.toUpperCase().includes('BURN'))
      );
      
      // Also check if transaction type indicates burn even if no explicit BURN account
      const isBurnTransaction = isTokenBurn || (sent.length > 0 && received.length === 0);
      
      if ((isBurnTransaction || burnAccount) && sent.length > 0) {
        // Token burn detected
        // Use the sent amount (negative) as the burn amount
        const burnAmountRaw = Math.abs(sent[0].amount);
        
        // Hedera API returns amounts in smallest unit (like tinybars for HBAR)
        // We need to convert using the token's decimals
        const decimals = sent[0].decimals || 8; // Default to 8 decimals for tokens
        const formattedAmount = (burnAmountRaw / Math.pow(10, decimals)).toFixed(decimals).replace(/\.?0+$/, '');
        
        // Get token symbol/name
        const token = tokenInfo.get(tokenId);
        const tokenDisplay = token?.symbol || token?.name || tokenId;
        
        const fromAccount = sent[0]; // The account that sent (burned) the tokens
        const fromName = fromAccount ? accountNames.get(fromAccount.account) : null;
        const shortAddr = fromAccount ? `${fromAccount.account.substring(0, 10)}...${fromAccount.account.substring(fromAccount.account.length - 6)}` : 'Unknown';
        const fromDisplay = fromAccount 
          ? (fromName ? `${fromName} (${shortAddr})` : `${shortAddr} (account name not available)`)
          : 'Unknown';
        
        summaryParts.push(`${fromDisplay} burned ${formattedAmount} ${tokenDisplay}`);
        
        actions.push({
          type: 'mutate',
          description: `Burned ${formattedAmount} ${tokenDisplay}`,
          from: fromAccount?.account,
          amount: formattedAmount,
          token: tokenDisplay,
        });
        
        if (fromAccount) {
          balanceChanges.push({
            address: fromAccount.account,
            amount: formattedAmount,
            coinType: tokenDisplay,
            change: 'decrease',
            accountName: fromName || undefined,
          });
        }
      } else if (sent.length > 0 && received.length > 0) {
        // Regular token transfer (not a burn)
        const from = sent[0].account;
        const to = received[0].account;
        
        // Skip if this is a burn (to is BURN account)
        if (to === 'BURN' || to === '0.0.0' || (isTokenBurn && to.toUpperCase().includes('BURN'))) {
          continue;
        }
        
        const amount = Math.abs(sent[0].amount);
        
        // Hedera API returns amounts in smallest unit (like tinybars for HBAR)
        // We need to convert using the token's decimals
        const decimals = sent[0].decimals || 8; // Default to 8 decimals for tokens
        const formattedAmount = (amount / Math.pow(10, decimals)).toFixed(decimals).replace(/\.?0+$/, '');
        
        // Get token symbol/name
        const token = tokenInfo.get(tokenId);
        const tokenDisplay = token?.symbol || token?.name || tokenId;
        
        const fromName = accountNames.get(from);
        const toName = accountNames.get(to);
        
        const fromDisplay = fromName ? `${fromName} (${from.substring(0, 8)}...${from.substring(from.length - 6)})` : `${from.substring(0, 8)}...${from.substring(from.length - 6)} (account name not available)`;
        const toDisplay = toName ? `${toName} (${to.substring(0, 8)}...${to.substring(to.length - 6)})` : `${to.substring(0, 8)}...${to.substring(to.length - 6)} (account name not available)`;
        
        summaryParts.push(`${fromDisplay} transferred ${formattedAmount} ${tokenDisplay} to ${toDisplay}`);
        
        actions.push({
          type: 'transfer',
          description: `Transferred ${formattedAmount} ${tokenDisplay}`,
          from,
          to,
          amount: formattedAmount,
          token: tokenDisplay,
        });
        
        balanceChanges.push({
          address: from,
          amount: formattedAmount,
          coinType: tokenDisplay,
          change: 'decrease',
          accountName: fromName || undefined,
        });
        
        balanceChanges.push({
          address: to,
          amount: formattedAmount,
          coinType: tokenDisplay,
          change: 'increase',
          accountName: toName || undefined,
        });
      }
    }
  }
  
  const fee = tx.fee ? tx.fee / 100_000_000 : 0; // Convert tinybars to HBAR
  if (fee > 0) {
    summaryParts.push(`Transaction fee: ${fee.toFixed(9)} HBAR`);
  }
  
  // Extract and format timestamp with proper validation
  let timestamp: string | undefined;
  let timestampFormatted: string | undefined;
  
  try {
    if (tx.timestampMs) {
      const date = new Date(tx.timestampMs);
      if (!isNaN(date.getTime())) {
        timestamp = date.toISOString();
        timestampFormatted = date.toLocaleString();
      }
    } else if (tx.timestamp) {
      // Hedera timestamp is in format: "1234567890.123456789" (seconds.nanoseconds)
      const timestampParts = tx.timestamp.split('.');
      if (timestampParts.length === 2) {
        const seconds = parseInt(timestampParts[0], 10);
        const nanos = parseInt(timestampParts[1], 10);
        if (!isNaN(seconds) && !isNaN(nanos)) {
          // Convert seconds to milliseconds and add nanoseconds (converted to milliseconds)
          const date = new Date(seconds * 1000 + Math.floor(nanos / 1_000_000));
          if (!isNaN(date.getTime())) {
            timestamp = date.toISOString();
            timestampFormatted = date.toLocaleString();
          }
        }
      } else {
        // Try parsing as ISO string or number
        const date = new Date(tx.timestamp);
        if (!isNaN(date.getTime())) {
          timestamp = date.toISOString();
          timestampFormatted = date.toLocaleString();
        }
      }
    }
  } catch (error) {
    console.error('Error parsing Hedera timestamp:', error);
    // Leave timestamp undefined if parsing fails
  }
  
  // Add explanations to balance changes
  balanceChanges.forEach((change: any) => {
    const accountName = change.accountName;
    const displayName = accountName || `${change.address.substring(0, 8)}...${change.address.substring(change.address.length - 6)} (account name not available)`;
    change.explanation = change.change === 'increase'
      ? `${displayName} received ${change.amount} ${change.coinType}`
      : `${displayName} sent ${change.amount} ${change.coinType}`;
  });
  
  return {
    summary: summaryParts.length > 0 ? summaryParts.join('. ') + '.' : 'Hedera transaction processed.',
    actions,
    gasUsed: fee > 0 ? `${fee.toFixed(9)} HBAR` : '0 HBAR',
    gasPrice: '0',
    totalGasCost: fee > 0 ? `${fee.toFixed(9)} HBAR` : '0 HBAR',
    objectsCreated: 0,
    objectsTransferred: 0,
    objectsMutated: 0,
    involvedAddresses: Array.from(accounts),
    moveCalls: [],
    timestamp,
    timestampFormatted,
    balanceChanges,
    accountNames,
  };
}

