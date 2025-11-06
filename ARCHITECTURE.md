# Architecture Documentation

## Overview

The Transaction Explainer MVP is a Next.js application that fetches blockchain transaction data from **Hedera Mirror Node API** and **Sui RPC** and provides human-readable explanations. The application supports both Hedera and Sui blockchains with a unified interface.

## System Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         │ HTTP Request
         ▼
┌─────────────────────────────────────┐
│      Next.js Application            │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Frontend (React Components) │  │
│  │  - TransactionExplainer      │  │
│  │  - TransactionVisualization  │  │
│  │  - Blockchain Selector      │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  API Routes                  │  │
│  │  /api/explain                │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │  Transaction Analysis        │  │
│  │  lib/hedera-client.ts        │  │
│  │  lib/sui-client.ts           │  │
│  └──────────────┬───────────────┘  │
└─────────────────┼───────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│ Hedera Mirror   │  │  Sui RPC Node   │
│ Node API        │  │  (Mainnet/Test) │
│ (REST API)      │  │  Blockberry API │
└─────────────────┘  └─────────────────┘
```

## Component Details

### 1. Frontend Components

#### TransactionExplainer
- Main UI component
- Handles user input (transaction digest)
- Manages API calls and state
- Displays explanation results
- Features:
  - Input validation
  - Loading states
  - Error handling
  - Copy-to-clipboard
  - "Explain Another" flow

#### TransactionVisualization
- Visual representation of transaction flow
- Shows:
  - Transfer arrows (sender → recipient)
  - Object creation indicators
  - Mutation markers
- Uses icons and color coding for action types

### 2. API Layer

#### /api/explain Route
- Next.js API route handler
- Supports both GET and POST
- Validates input
- Calls transaction analysis
- Returns JSON response

### 3. Transaction Analysis Engine

#### lib/hedera-client.ts

**Core Functions:**

1. `fetchHederaTransaction(transactionId)`
   - Connects to Hedera Mirror Node REST API
   - Fetches transaction data by ID or hash
   - Handles transaction ID normalization

2. `explainHederaTransaction(transaction)`
   - Analyzes Hedera transaction structure
   - Extracts:
     - HBAR transfers
     - Token transfers and burns
     - Transaction fees
     - Timestamps
     - Account information
   - Generates human-readable summaries

3. `getHederaAccountName(accountId)`
   - Fetches account names from Hedera Mirror Node API

4. `getHederaTokenInfo(tokenId)`
   - Fetches token metadata (name, symbol, decimals)

#### lib/sui-client.ts

**Core Functions:**

1. `fetchTransaction(digest)`
   - Connects to Blockberry API (primary) or Sui RPC (fallback)
   - Fetches full transaction data
   - Includes all relevant options (effects, events, object changes, balance changes)

2. `explainTransaction(transaction)`
   - Analyzes Sui transaction structure
   - Extracts:
     - Object changes (created, transferred, mutated)
     - Balance changes
     - Move function calls
     - Gas usage
   - Generates human-readable summaries

**Analysis Logic:**

```typescript
Transaction Data
    ↓
Parse Object Changes
    ├─ Created → Track creation count
    ├─ Transferred → Extract sender/recipient
    └─ Mutated → Track mutation count
    ↓
Parse Balance Changes
    ├─ Positive → Received funds
    └─ Negative → Sent funds
    ↓
Parse Move Calls
    └─ Extract package/module/function
    ↓
Generate Summary
    └─ Combine all actions into plain language
```

## Data Flow

1. **User Input** → Transaction digest/hash entered + blockchain selection
2. **API Request** → POST to `/api/explain` with `blockchain` parameter
3. **Blockchain-Specific Fetch**:
   - **Hedera**: `fetchHederaTransaction()` → Hedera Mirror Node API
   - **Sui**: `fetchTransaction()` → Blockberry API or Sui RPC
4. **Analysis** → `explainHederaTransaction()` or `explainTransaction()` processes data
5. **AI Enhancement** (optional) → Google Gemini API enhances explanation
6. **Response** → JSON with explanation object
7. **Display** → UI renders summary, stats, visualization

## Transaction Data Structure

### Hedera Transactions

The application analyzes these Hedera transaction components:

- **Transfers**: HBAR transfers between accounts
- **Token Transfers**: Token transfers including burns
- **Transaction Fees**: Charged transaction fees
- **Timestamps**: Consensus timestamps
- **Account Information**: Account names and metadata
- **Token Information**: Token names, symbols, and decimals

### Sui Transactions

The application analyzes these Sui transaction components:

- **Object Changes**:
  - `type: 'created'` - New objects created
  - `type: 'transferred'` - Objects transferred between addresses
  - `type: 'mutated'` - Objects modified
- **Balance Changes**:
  - Positive amounts → Receipts
  - Negative amounts → Payments
  - Owner addresses → Participants
- **Move Calls**:
  - Package ID
  - Module name
  - Function name
  - Arguments
- **Gas Usage**:
  - Computation cost
  - Storage cost
  - Total cost (in MIST, converted to SUI)

## Error Handling

- Network errors → User-friendly error messages
- Invalid digests → Validation errors
- Missing transaction → 404-style handling
- RPC failures → Graceful degradation

## Performance Considerations

- Client-side rendering for fast UI
- API route caching (can be added)
- RPC call optimization (minimal requests)
- Lazy loading of visualization components

## Security

- Input validation on both client and server
- No sensitive data stored
- RPC calls are read-only
- No authentication required (public transactions)

## Extensibility Points

1. **Additional Blockchain Support**
   - Abstract blockchain client interface
   - Chain-specific analyzers (Hedera, Sui already implemented)
   - Unified explanation format
   - Easy to add Ethereum, Solana, etc.

2. **LLM Integration**
   - Add OpenAI/Anthropic API calls
   - Generate more natural summaries
   - Context-aware explanations

3. **Enhanced Visualization**
   - D3.js or React Flow for diagrams
   - Interactive transaction graphs
   - Timeline views

4. **Caching Layer**
   - Redis for transaction caching
   - Reduce RPC load
   - Faster responses

5. **Analytics**
   - Track popular transactions
   - Usage statistics
   - Performance metrics

## Deployment Architecture

### Development
- Local Next.js dev server
- Direct RPC connection

### Production
- Vercel/Netlify deployment
- Edge functions for API routes
- CDN for static assets
- Environment-based RPC endpoint selection
