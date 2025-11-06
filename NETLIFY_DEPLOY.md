# Netlify Deployment Guide

This guide will help you deploy the Blockchain Transaction Explainer to Netlify.

## Prerequisites

1. A Netlify account (sign up at https://www.netlify.com)
2. Your project code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository

3. **Configure Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - Netlify will automatically detect Next.js and use the `netlify.toml` configuration

4. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add the following variables (all optional):
     ```
     GOOGLE_GEMINI_API_KEY=your_gemini_key_here
     BLOCKBERRY_API_KEY=LqFsv1GGYsa7hcHvQye19fquqCWAh2
     NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
     ```
   - Note: The app will work without `GOOGLE_GEMINI_API_KEY`, but AI enhancement will be disabled.

5. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your site
   - Your site will be live at `https://your-site-name.netlify.app`

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize and Deploy**
   ```bash
   # Initialize (first time only)
   netlify init
   
   # Build the project
   npm run build
   
   # Deploy
   netlify deploy --prod
   ```

4. **Set Environment Variables via CLI**
   ```bash
   netlify env:set GOOGLE_GEMINI_API_KEY "your_gemini_key_here"
   netlify env:set BLOCKBERRY_API_KEY "LqFsv1GGYsa7hcHvQye19fquqCWAh2"
   netlify env:set NEXT_PUBLIC_SUI_RPC_URL "https://fullnode.mainnet.sui.io:443"
   ```

## Environment Variables

### Required
None - The app works with default values.

### Optional
- **GOOGLE_GEMINI_API_KEY**: Enables AI-enhanced explanations. Get a free key from https://makersuite.google.com/app/apikey
- **BLOCKBERRY_API_KEY**: Defaults to the provided key if not set
- **NEXT_PUBLIC_SUI_RPC_URL**: Defaults to Sui mainnet if not set

## Build Configuration

The project uses:
- **Framework**: Next.js 14
- **Node Version**: 18
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node.js version is 18 or higher
- Check build logs in Netlify dashboard

### API Routes Not Working
- Ensure `@netlify/plugin-nextjs` is installed (handled automatically)
- Check that API routes are in `app/api/` directory
- Verify environment variables are set correctly

### Environment Variables Not Working
- Ensure variables are set in Netlify dashboard (Site settings → Environment variables)
- Redeploy after adding new environment variables
- Use `NEXT_PUBLIC_` prefix for client-side variables

## Post-Deployment

1. **Test the deployment**
   - Visit your Netlify URL
   - Try explaining a transaction
   - Verify all features work

2. **Custom Domain (Optional)**
   - Go to Site settings → Domain management
   - Add your custom domain
   - Follow DNS configuration instructions

3. **Enable Analytics (Optional)**
   - Go to Site settings → Analytics
   - Enable Netlify Analytics if desired

## Support

If you encounter issues:
1. Check Netlify build logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed

