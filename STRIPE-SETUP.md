# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payment processing for the Driving Instructors booking app.

## Step 1: Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up for a free Stripe account
3. Complete the account verification process

## Step 2: Get Your API Keys

### For Testing (Sandbox/Test Mode):

1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key" to see it

### For Production (Live Mode):

1. After completing Stripe account activation
2. Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. You'll see:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)

**⚠️ IMPORTANT:**
- NEVER commit the secret key to git
- Use test keys for development/testing
- Use live keys only for production

## Step 3: Local Development Setup

1. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add your **TEST** keys:
```env
STRIPE_SECRET_KEY=sk_test_your_actual_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_test_key_here
BASE_URL=http://localhost:3000
PORT=3000
```

3. Start the development server:
```bash
npm start
```

4. You should see: `✓ Stripe initialized in TEST mode`

## Step 4: Vercel Deployment Setup

### Set Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `STRIPE_SECRET_KEY` | `sk_test_your_key` | Production, Preview, Development |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_your_key` | Production, Preview, Development |
| `BASE_URL` | `https://your-app.vercel.app` | Production |
| `BASE_URL` | `https://your-preview.vercel.app` | Preview |

**For Production Deployment:**
- Use your **LIVE** Stripe keys (`sk_live_...` and `pk_live_...`)
- Update `BASE_URL` to your production domain

### Quick Setup Commands:

You can also set them via Vercel CLI:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Set environment variables
vercel env add STRIPE_SECRET_KEY
# Paste your sk_test_... key when prompted
# Select: Production, Preview, Development

vercel env add STRIPE_PUBLISHABLE_KEY
# Paste your pk_test_... key when prompted
# Select: Production, Preview, Development

vercel env add BASE_URL
# Enter: https://your-app.vercel.app
# Select: Production only
```

## Step 5: Test the Integration

### Using Test Cards:

Stripe provides test card numbers for testing:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Declined card |

**Test Card Details:**
- Use any future expiry date (e.g., `12/25`)
- Use any 3-digit CVC (e.g., `123`)
- Use any billing postal code

### Test Flow:

1. Search for an instructor in ChatGPT
2. Click "Book Now" or select a date from calendar
3. Choose a package (1, 2, 4, 10, or 20 hours)
4. Enter your email
5. Click "Pay with Stripe"
6. You'll be redirected to Stripe Checkout
7. Use test card: `4242 4242 4242 4242`
8. Complete the payment
9. You'll be redirected to success page

## Step 6: Monitor Payments

### View Test Payments:
- Go to [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments)
- You'll see all test transactions

### View Live Payments:
- Go to [https://dashboard.stripe.com/payments](https://dashboard.stripe.com/payments)

## Environment Variables Reference

### Required for Stripe Integration:

```env
# Stripe Secret Key (server-side only, NEVER expose in client)
STRIPE_SECRET_KEY=sk_test_...

# Stripe Publishable Key (safe to use in client-side code)
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Base URL for redirect URLs after payment
BASE_URL=https://your-app.vercel.app
```

### Optional:

```env
# Server port (default: 3000)
PORT=3000
```

## Security Best Practices

1. ✅ **DO:**
   - Use test keys for development
   - Store keys in environment variables
   - Use `.gitignore` to exclude `.env` file
   - Keep secret keys server-side only

2. ❌ **DON'T:**
   - Commit API keys to git
   - Share secret keys publicly
   - Use live keys for testing
   - Expose secret keys in client-side code

## Troubleshooting

### "Stripe not configured" Error:
- Check that `STRIPE_SECRET_KEY` is set in environment variables
- Verify the key starts with `sk_test_` or `sk_live_`
- Restart the server after adding environment variables

### Redirect URL Error:
- Ensure `BASE_URL` is set correctly in Vercel
- Check that the URL matches your deployment URL

### Payment Not Processing:
- Check Stripe dashboard for error messages
- Verify you're using a valid test card
- Check server logs for error details

## Support

- Stripe Documentation: [https://stripe.com/docs](https://stripe.com/docs)
- Stripe Testing: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
- Stripe API Reference: [https://stripe.com/docs/api](https://stripe.com/docs/api)

## Summary of Keys Needed

For **Vercel Production Deployment**, set these in Vercel Dashboard:

```
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_...
BASE_URL=https://drivers-mu.vercel.app
```

Replace with your actual Vercel URL and Stripe keys from the dashboard.
