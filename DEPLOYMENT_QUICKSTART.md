# Quick Start: Deploy to Netlify

## 🚀 Fastest Way to Deploy

### Step 1: Push to Git
```bash
git add .
git commit -m "Ready for Netlify deployment"
git push origin main
```

### Step 2: Deploy on Netlify

1. **Go to**: https://app.netlify.com
2. **Click**: "Add new site" → "Import an existing project"
3. **Connect**: Your Git provider (GitHub/GitLab/Bitbucket)
4. **Select**: Your repository
5. **Configure** (Netlify auto-detects Next.js):
   - Build command: `npm run build` (auto-filled)
   - Publish directory: `.next` (auto-filled)
6. **Click**: "Deploy site"

### Step 3: Add Environment Variables (Optional)

After first deployment, go to:
- **Site settings** → **Environment variables**

Add these (all optional):
```
GOOGLE_GEMINI_API_KEY=your_key_here
BLOCKBERRY_API_KEY=LqFsv1GGYsa7hcHvQye19fquqCWAh2
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
```

Then **trigger a new deployment** (Deploys → Trigger deploy)

### Step 4: Done! 🎉

Your site is live at: `https://your-site-name.netlify.app`

## 📝 Notes

- ✅ Build already tested and working
- ✅ All configuration files ready (`netlify.toml`)
- ✅ Works without environment variables (AI enhancement optional)
- ✅ Automatic deployments on every git push

## 🔧 Troubleshooting

**Build fails?**
- Check Netlify build logs
- Ensure Node.js 18+ is used (configured in `netlify.toml`)

**API routes not working?**
- The `@netlify/plugin-nextjs` handles this automatically
- Check environment variables are set correctly

**Need help?**
- See `NETLIFY_DEPLOY.md` for detailed instructions

