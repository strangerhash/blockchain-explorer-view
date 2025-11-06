# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment (Optional)**
   ```bash
   cp .env.example .env.local
   # Edit .env.local if you want to use a custom RPC endpoint
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Testing with a Real Transaction

1. Find a Sui transaction digest from:
   - [Sui Explorer](https://suiexplorer.com/)
   - A transaction you've executed
   - Test transaction: Look for any recent transaction on Sui mainnet

2. Copy the transaction digest (starts with `0x`)

3. Paste it into the input field and click "Explain Transaction"

## Example Transaction

You can test with any Sui mainnet transaction. Here's how to find one:

1. Go to https://suiexplorer.com/
2. Click on any recent transaction
3. Copy the transaction digest from the URL or page
4. Paste it into the app

## Troubleshooting

### "Cannot find module '@mysten/sui.js'"
- Run `npm install` to install dependencies

### "Failed to fetch transaction"
- Check your internet connection
- Verify the transaction digest is valid
- Ensure you're using a valid Sui network (mainnet/testnet/devnet)

### RPC Connection Issues
- The app defaults to Sui mainnet RPC
- You can override with `NEXT_PUBLIC_SUI_RPC_URL` in `.env.local`
- For testnet: `https://fullnode.testnet.sui.io:443`
- For devnet: `https://fullnode.devnet.sui.io:443`

## Building for Production

```bash
npm run build
npm start
```

## Deploying to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variable (optional):
   - `NEXT_PUBLIC_SUI_RPC_URL` - Custom RPC endpoint
4. Deploy

The app will automatically build and deploy.
