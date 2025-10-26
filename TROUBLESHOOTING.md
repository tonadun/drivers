# Payment Integration Troubleshooting

## Issue: "Creating payment link..." appears and then button resets

This happens when the payment request fails. Here's how to diagnose and fix:

### Step 1: Check Browser Console Logs

The updated code now logs detailed information. In ChatGPT:

1. Right-click on the app → Inspect Element (if available)
2. Go to Console tab
3. Click the "Pay" button
4. Look for these logs:
   - `Sending payment request to: <URL>`
   - `Response status: <number>`
   - `Response data: <object>`

### Step 2: Common Errors and Solutions

#### Error: "Stripe not configured"
**Response status: 503**

**Cause:** Environment variables not set in Vercel

**Solution:**
1. Go to https://vercel.com/
2. Select your `drivers` project
3. Go to Settings → Environment Variables
4. Add these variables for **Production**:
   ```
   STRIPE_SECRET_KEY = sk_test_your_stripe_secret_key_here
   STRIPE_PUBLISHABLE_KEY = pk_test_your_stripe_publishable_key_here
   BASE_URL = https://drivers-mu.vercel.app
   ```
5. After adding, redeploy:
   ```bash
   vercel --prod --yes
   ```

#### Error: "Payment integration not available. Please try again in ChatGPT."
**window.openai is not available**

**Cause:** App is being tested in a regular browser instead of ChatGPT

**Solution:**
- The payment flow ONLY works when running in ChatGPT
- Test in a regular browser won't work because `window.openai` API is only available in ChatGPT's iframe
- You must test the app by refreshing it in ChatGPT

#### Error: "No payment URL returned from server"
**Response status: 200 but no URL in data**

**Cause:** Stripe API error (likely invalid keys)

**Solution:**
1. Verify your Stripe keys are correct:
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy the **exact** keys (including `sk_test_` prefix)
2. Update environment variables in Vercel
3. Redeploy

#### Error: Network error / Fetch failed
**Cannot connect to server**

**Cause:** Server is down or URL is wrong

**Solution:**
1. Verify deployment is successful:
   ```bash
   vercel ls
   ```
2. Test the endpoint manually:
   ```bash
   curl -X POST https://your-deployment-url.vercel.app/api/create-checkout-session \
     -H "Content-Type: application/json" \
     -d '{"instructorId":"instructor-001","packageHours":1,"email":"test@example.com","selectedDate":"2024-01-15"}'
   ```

### Step 3: Verify Stripe Configuration

Check if Stripe is initialized on the server:

1. View deployment logs in Vercel:
   - Go to your Vercel project
   - Click on Deployments
   - Click on latest deployment
   - View Function logs

2. Look for:
   - ✅ `✓ Stripe initialized in TEST mode` - GOOD!
   - ⚠️ `⚠️ Stripe not initialized: STRIPE_SECRET_KEY not set` - NEEDS FIX!

### Step 4: Test Payment Flow

Once environment variables are set:

1. **Refresh the app in ChatGPT** (important!)
2. Search for an instructor
3. Click "Book Now"
4. Select a package
5. Enter your email
6. Click "Pay £35" (or whatever amount)
7. You should see:
   - Button shows "Creating payment link..."
   - A new browser window/tab opens with Stripe Checkout
   - Dialog closes
   - ChatGPT shows a follow-up message

### Step 5: Test Stripe Checkout

In the Stripe Checkout page that opens:

1. Use test card: `4242 4242 4242 4242`
2. Any future expiry date (e.g., `12/25`)
3. Any 3-digit CVC (e.g., `123`)
4. Any billing postal code
5. Click "Pay"
6. You should be redirected to success page

### Quick Checklist

- [ ] Environment variables set in Vercel (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, BASE_URL)
- [ ] Deployment successful (`vercel --prod --yes`)
- [ ] App refreshed in ChatGPT (not testing in regular browser)
- [ ] Stripe dashboard shows test mode enabled
- [ ] Browser console shows no CORS errors

### Still Not Working?

If you've completed all the above and it's still not working:

1. Share the error message from the alert dialog
2. Share the console logs (Response status and Response data)
3. Share the Vercel function logs

This will help identify the exact issue.

## Working Example

When everything is configured correctly, the flow should be:

1. **Click "Pay £35"**
   - Console: `Sending payment request to: https://your-app.vercel.app/api/create-checkout-session`
   - Console: `Response status: 200`
   - Console: `Response data: { sessionId: "cs_test_...", url: "https://checkout.stripe.com/..." }`
   - Console: `Opening external URL: https://checkout.stripe.com/...`

2. **New window opens**
   - Stripe Checkout page loads
   - Shows: "Driving Lessons with [Instructor Name]"
   - Amount: £35.00 (or discounted amount)

3. **Complete payment**
   - Enter test card: 4242 4242 4242 4242
   - Success page loads
   - Shows booking confirmation

## Environment Variables Reference

For quick copy-paste into Vercel (update with your own keys):

```
Name: STRIPE_SECRET_KEY
Value: sk_test_your_stripe_secret_key_here
Environment: Production

Name: STRIPE_PUBLISHABLE_KEY
Value: pk_test_your_stripe_publishable_key_here
Environment: Production

Name: BASE_URL
Value: https://drivers-mu.vercel.app
Environment: Production
```

**Important:** Replace the placeholder keys above with your actual keys from https://dashboard.stripe.com/test/apikeys
