# Deployment Guide - Environment Variables Setup

## Problem
The app works on localhost but fails on Vercel because the frontend tries to call `/api/offers` which doesn't exist in production.

## Solution
Use environment variables to configure the API base URL for different environments.

---

## Local Development Setup

### Option 1: Using Proxy (Current Setup)
If you have a proxy server configured (like `proxy-server.js`):

1. Create a `.env` file in the root directory:
```bash
VITE_API_BASE_URL=
```

2. Start your proxy server and the Vite dev server
3. The app will call `/api/offers` which your proxy will forward to the actual backend

### Option 2: Direct Backend URL
If you have a separate backend server running:

1. Create a `.env` file:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

2. Start your backend server on port 3001
3. Start the Vite dev server
4. The app will call `http://localhost:3001/api/offers`

---

## Vercel Production Deployment

### Step 1: Identify Your Backend API
Determine where your actual backend API is hosted:
- **Make.com webhook**: `https://hook.us1.make.com/your-webhook-id`
- **Custom backend**: `https://api.yourdomain.com`
- **Vercel Serverless Functions**: Leave empty (if using Vercel API routes)

### Step 2: Add Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: Your backend API URL (e.g., `https://hook.us1.make.com`)
   - **Environments**: Select Production, Preview, and Development

### Step 3: Redeploy
After adding the environment variable, trigger a new deployment:
```bash
git commit --allow-empty -m "Trigger rebuild with env vars"
git push origin master
```

Or use the Vercel dashboard to redeploy.

---

## How It Works

The updated code in `OfferPage.tsx`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const OFFERS_WEBHOOK_URL = `${API_BASE_URL}/api/offers`;
```

- **Localhost with proxy**: `VITE_API_BASE_URL=''` → calls `/api/offers` → proxy forwards it
- **Production**: `VITE_API_BASE_URL='https://your-api.com'` → calls `https://your-api.com/api/offers`

---

## Verification

### Check Environment Variable is Loaded
Add this temporarily to your component to verify:
```typescript
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Full URL:', OFFERS_WEBHOOK_URL);
```

### Common Issues

1. **Still getting 404 in production**
   - Verify the environment variable is set in Vercel
   - Check the variable name starts with `VITE_` (required by Vite)
   - Redeploy after adding environment variables

2. **Environment variable is undefined**
   - Vite requires `VITE_` prefix for exposed variables
   - Restart the dev server after changing `.env`
   - Don't use quotes around values in `.env` file

3. **CORS errors**
   - Your backend API needs to allow requests from your Vercel domain
   - Add CORS headers to your backend/webhook

---

## Security Notes

- **Never commit `.env` files** to git (already in `.gitignore`)
- Only commit `.env.example` files as templates
- Sensitive API keys should only be in Vercel environment variables
- Use different API endpoints/keys for development vs production

---

## Next Steps

1. Create your `.env` file based on `.env.example`
2. Configure the `VITE_API_BASE_URL` in Vercel
3. Update the value to your actual backend API URL
4. Test locally first, then deploy to Vercel
5. Verify the API calls work in production
