# Shopify Integration Setup Guide

## Why Shopify Integration Isn't Working

The Shopify integration requires **environment variables** to be set up. Without these, the integration cannot connect to Shopify.

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Shopify API Credentials
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_SCOPES=read_orders,read_products
SHOPIFY_REDIRECT_URI=http://localhost:3004/api/integrations/shopify/callback
```

## How to Get Shopify Credentials

### 1. Create a Shopify Partner Account
- Go to: https://partners.shopify.com/
- Sign up for a free partner account

### 2. Create a Custom App
1. Log into Shopify Partners
2. Go to "Apps" → "Create app"
3. Choose "Custom app"
4. Fill in app details:
   - **App name**: Eradaty Finance
   - **App URL**: `http://localhost:3004`
   - **Redirect URL**: `http://localhost:3004/api/integrations/shopify/callback`

### 3. Get API Credentials
1. After creating the app, go to "API credentials"
2. Copy the **API key** → Add to `SHOPIFY_API_KEY`
3. Copy the **API secret** → Add to `SHOPIFY_API_SECRET`

### 4. Set Scopes
In the app settings, request these scopes:
- `read_orders` - To fetch order data
- `read_products` - To fetch product information

### 5. Install the App
1. Go to your Shopify store admin
2. Install your custom app
3. Authorize the requested permissions

## Testing the Integration

1. **Restart your dev server** after adding environment variables
2. Go to: `http://localhost:3004/integrations`
3. Enter your store domain: `your-store.myshopify.com`
4. Click "Connect"
5. You'll be redirected to Shopify to authorize
6. After authorization, you'll be redirected back
7. Click "Sync Orders" to fetch your orders

## Troubleshooting

### "Integration not working"
- ✅ Check environment variables are set
- ✅ Restart dev server after adding variables
- ✅ Verify API credentials are correct
- ✅ Check redirect URI matches exactly

### "Authorization failed"
- ✅ Verify scopes are correct
- ✅ Check API secret is correct
- ✅ Ensure app is installed in your store

### "No orders syncing"
- ✅ Check you have orders in the last 90 days
- ✅ Verify `read_orders` scope is granted
- ✅ Check Supabase migrations are run

## For Production

When deploying to production:
1. Update `SHOPIFY_REDIRECT_URI` to your production domain
2. Update app settings in Shopify Partners
3. Use environment variables in your hosting platform
4. Never commit API credentials to git

## Current Implementation

The Shopify integration code is working correctly. It just needs the environment variables to function.

**Files:**
- `/app/api/integrations/shopify/connect/route.ts` - OAuth initiation
- `/app/api/integrations/shopify/callback/route.ts` - OAuth callback
- `/app/api/integrations/shopify/sync/route.ts` - Order syncing
- `/lib/shopify.ts` - Shopify API helpers
