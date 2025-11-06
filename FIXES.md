# Installation Fixes

## @mysten/sui.js Package Version Issue

If you encounter an error with `@mysten/sui.js` version, try these solutions:

### Solution 1: Use Latest Stable Version
```bash
npm install @mysten/sui.js@latest
```

### Solution 2: Check Available Versions
```bash
npm view @mysten/sui.js versions
```

### Solution 3: Alternative Import (if client subpath doesn't work)
If the import `from '@mysten/sui.js/client'` fails, try:

```typescript
// Alternative import
import { JsonRpcProvider, mainnetConnection } from '@mysten/sui.js';

// Then use:
const provider = new JsonRpcProvider(mainnetConnection);
```

### Solution 4: Update Import Path
The package structure may have changed. Check the actual exports:

```bash
npm list @mysten/sui.js
```

## Google Gemini API Key

The app works without AI, but for AI-enhanced explanations:

1. Get free API key from: https://aistudio.google.com/apikey
2. Add to `.env.local`: `GOOGLE_GEMINI_API_KEY=your_key_here`
3. Restart the dev server

## Common Issues

### "Cannot find module '@mysten/sui.js/client'"
- Try: `npm install @mysten/sui.js@^0.56.0`
- Or check package.json and adjust version range
- May need to update import path based on package version

### "Cannot find module '@google/generative-ai'"
- Run: `npm install @google/generative-ai`
- This package is required for AI features

### TypeScript Errors
- Ensure `@types/node` is installed: `npm install --save-dev @types/node`
- Run: `npm run build` to check for type errors

## Testing Without Dependencies

You can test the UI without installing Sui SDK by:
1. Mocking the API response
2. Using the `/docs` page which doesn't require blockchain connection
