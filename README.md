# Blockchain Transaction Explainer MVP

A web application that explains blockchain transactions in plain language, making complex transaction data understandable for users.

## Features

- ✅ Accepts transaction digest (hash) or transaction link
- ✅ Fetches transaction details from Sui RPC
- ✅ Human-readable summaries (e.g., "Alice transferred 100 SUI to Bob")
- ✅ **AI-Enhanced Explanations** using Google Gemini (free tier)
- ✅ AI-powered insights and risk analysis
- ✅ Tracks object creation, transfer, and mutation
- ✅ Displays gas usage in SUI
- ✅ Visual flow diagrams showing transaction flow
- ✅ Move call identification and labeling
- ✅ "Explain Another Transaction" button for quick iteration
- ✅ Copy-to-clipboard functionality
- ✅ Professional documentation page

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 (React), TypeScript, Tailwind CSS
- **Blockchain**: Sui blockchain SDK (@mysten/sui.js)
- **AI**: Google Gemini API (@google/generative-ai) - Free tier available
- **API**: Next.js API Routes

### Project Structure
```
/
├── app/
│   ├── api/explain/        # API endpoint for transaction explanation
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page
├── components/
│   ├── TransactionExplainer.tsx    # Main UI component
│   └── TransactionVisualization.tsx # Flow visualization
├── lib/
│   ├── sui-client.ts       # Sui RPC client and transaction analysis
│   └── genai-service.ts     # Google Gemini AI integration
├── app/
│   └── docs/               # Professional documentation page
└── package.json
```

## Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Access to Sui RPC endpoint (defaults to mainnet)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment (optional):
```bash
# Create .env.local
cp .env.example .env.local

# Edit .env.local and add:
# NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443 (optional)
# GOOGLE_GEMINI_API_KEY=your_key_here (optional, for AI features)
```

**Getting a Free Gemini API Key:**
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API key in new project"
4. Copy the key and add it to `.env.local`

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a transaction digest (e.g., `0x1234...`) in the input field
2. Click "Explain Transaction" or press Enter
3. View the human-readable summary and visualization
4. Use "Explain Another Transaction" to analyze more transactions

## API

### POST /api/explain
Explains a transaction by digest.

**Request:**
```json
{
  "digest": "0x1234..."
}
```

**Response:**
```json
{
  "success": true,
  "digest": "0x1234...",
  "explanation": {
    "summary": "Alice transferred 100 SUI to Bob. 2 new objects were created.",
    "actions": [...],
    "gasUsed": "0.001 SUI",
    "totalGasCost": "0.0015 SUI",
    "objectsCreated": 2,
    "objectsTransferred": 1,
    "objectsMutated": 0,
    "involvedAddresses": [...],
    "moveCalls": [...]
  }
}
```

### GET /api/explain?digest=0x1234...
Same as POST but with query parameter.

## Data Source

- **Primary**: Sui RPC API (mainnet/testnet)
- **Transaction Data**: Fetched via `sui_getTransactionBlock` with full options
- **Analysis**: Local processing of transaction effects, object changes, and balance changes

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Deploy (no build configuration needed)

### Manual Build
```bash
npm run build
npm start
```

## Integration Recommendations

### Where This Should Live

#### Option 1: **GenAI Platform** (Recommended)
**Pros:**
- Natural fit for AI-powered explanation
- Can leverage LLM for even better summaries
- Extensible for multi-chain support
- Can add conversation/context features

**Integration Points:**
- Add as a "Transaction Analysis" tool in GenAI chat
- Use as a plugin/widget that can be embedded
- API-first design allows easy integration

#### Option 2: **Interoperability Protocol Explorer**
**Pros:**
- Part of transaction inspection workflow
- Users already exploring transactions
- Can show cross-chain transaction flows

**Cons:**
- May be too focused on protocol-level details
- Less emphasis on plain language explanation

#### Option 3: **Stablecoin Studio**
**Pros:**
- Users need to understand token transfers
- Stablecoin-specific context (amounts, recipients)
- Can add stablecoin-specific insights

**Cons:**
- Limited to stablecoin transactions
- May miss broader use cases

#### Option 4: **API Management Platform**
**Pros:**
- Can be a showcase/example API
- Demonstrates API capabilities
- Can be packaged as a service

**Cons:**
- Less user-facing
- May not reach end users directly

### Recommendation: **GenAI Platform**

This feature fits best in a GenAI platform because:
1. **Natural Language Focus**: Explaining transactions in plain language aligns with GenAI's core value
2. **Extensibility**: Can evolve to use LLMs for even better explanations
3. **Multi-Purpose**: Works for developers, users, and analysts
4. **API-First**: Can be embedded anywhere via API
5. **Future-Proof**: Can add multi-chain, context-aware explanations, and conversation features

## Future Enhancements

- [ ] Multi-chain support (Ethereum, Solana, etc.)
- [ ] LLM-powered explanations for complex transactions
- [ ] Transaction comparison feature
- [ ] Export explanations (PDF, JSON)
- [ ] Historical transaction analysis
- [ ] Token/NFT metadata enrichment
- [ ] Smart contract source code analysis
- [ ] Transaction simulation preview

## License

MIT
# blockchain-explorer-view
