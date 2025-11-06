# Blockberry API Integration

## ✅ Changes Made

### 1. API Integration
- ✅ Updated `fetchTransaction()` to use Blockberry API: `https://api.blockberry.one/sui/v1/raw-transactions/{digest}`
- ✅ API Key: `LqFsv1GGYsa7hcHvQye19fquqCWAh2` (hardcoded, can be set via `BLOCKBERRY_API_KEY` env var)
- ✅ Proper response normalization - handles `result.digest`, `result.transaction`, `result.effects`, etc.
- ✅ Fallback to Sui RPC if Blockberry API fails

### 2. Improved Data Parsing
- ✅ Enhanced gas extraction to handle both Sui SDK and Blockberry formats
- ✅ Better sender extraction from transaction data
- ✅ Improved Move call parsing for nested transaction structures
- ✅ Smart transfer matching - pairs senders with recipients by amount

### 3. Human-Readable Formatting
- ✅ **Amount Conversion**: Automatically converts MIST to SUI (e.g., `5325090` → `0.00532509 SUI`)
- ✅ **Smart Summaries**: Detects transaction types (swaps, oracle updates, transfers)
- ✅ **Transfer Matching**: Matches senders and recipients to show complete transfers
- ✅ **Transaction Type Detection**:
  - Oracle/Price updates (Pyth)
  - Cross-chain transactions (VAA)
  - Token swaps
  - DEX aggregator swaps

### 4. Visualization Improvements
- ✅ **Proper Arrows**: Every transfer now shows sender → recipient with arrow
- ✅ **Color Coding**: Red for sent, green for received
- ✅ **Better Layout**: Shows up to 10 transfers with proper formatting
- ✅ **Edge Cases**: Handles mint/create, burn/send scenarios

### 5. Gemini Model Fix
- ✅ **Multiple Fallbacks**: Tries `gemini-1.0-pro`, `gemini-pro`, `gemini-1.5-pro`, etc.
- ✅ **Graceful Degradation**: Falls back to improved summary if AI fails
- ✅ **Better Error Handling**: Logs which model works, continues on failure

## Example Output

### Before:
```
0x4b5d...053c sent 10,445,944; 0x4b5d...053c received 856,516,238,554...
```

### After:
```
Updated 2 price feeds via Pyth oracle (cross-chain data). The transaction paid 0.005 SUI in gas fees.
```

### Visualization:
```
[0x0087...0083a] →→→ [0x2117...7383f]
  -0.005 SUI          +0.000000001 SUI
```

## API Response Format

Blockberry API returns:
```json
{
  "result": {
    "digest": "...",
    "transaction": { ... },
    "effects": { ... },
    "objectChanges": [ ... ],
    "balanceChanges": [ ... ],
    "events": [ ... ]
  }
}
```

The code normalizes this to match Sui SDK format for consistent processing.

## Testing

Test with the provided transaction:
- Digest: `FfW4z5gxwoXnUj5HP3d9qmUEsXWYBVjrCwzpvmzbgUhM`
- Expected: Pyth oracle price update transaction
- Should show: "Updated 2 price feeds via Pyth oracle" instead of raw numbers
