# Architecture Documentation

## Overview

The Transaction Explainer MVP is a Next.js application that fetches blockchain transaction data from Sui RPC and provides human-readable explanations.

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
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  API Routes                  │  │
│  │  /api/explain                │  │
│  └──────────────┬───────────────┘  │
│                 │                   │
│  ┌──────────────▼───────────────┐  │
│  │  Transaction Analysis        │  │
│  │  lib/sui-client.ts           │  │
│  └──────────────┬───────────────┘  │
└─────────────────┼───────────────────┘
                  │
                  │ RPC Call
                  ▼
         ┌─────────────────┐
         │   Sui RPC Node  │
         │  (Mainnet/Test) │
         └─────────────────┘
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

#### lib/sui-client.ts

**Core Functions:**

1. `fetchTransaction(digest)`
   - Connects to Sui RPC
   - Fetches full transaction data
   - Includes all relevant options (effects, events, object changes, balance changes)

2. `explainTransaction(transaction)`
   - Analyzes transaction structure
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

1. **User Input** → Transaction digest entered
2. **API Request** → POST to `/api/explain`
3. **RPC Fetch** → `suiClient.getTransactionBlock()`
4. **Analysis** → `explainTransaction()` processes data
5. **Response** → JSON with explanation object
6. **Display** → UI renders summary, stats, visualization

## Transaction Data Structure

The application analyzes these Sui transaction components:

### Object Changes
- `type: 'created'` - New objects created
- `type: 'transferred'` - Objects transferred between addresses
- `type: 'mutated'` - Objects modified

### Balance Changes
- Positive amounts → Receipts
- Negative amounts → Payments
- Owner addresses → Participants

### Move Calls
- Package ID
- Module name
- Function name
- Arguments

### Gas Usage
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

1. **Multi-chain Support**
   - Abstract RPC client interface
   - Chain-specific analyzers
   - Unified explanation format

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
