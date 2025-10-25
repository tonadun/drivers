# Deployment Guide - Useless MCP on app-sdk.com

## Current Deployment Status

✅ **Deployed to Vercel**: https://useless-9z6ie2kqs-tonadun-gmailcoms-projects.vercel.app
🎯 **Target URL**: https://app-sdk.com/mcp/useless

---

## Step 1: Disable Deployment Protection

Your deployment is currently protected by Vercel authentication. To make it publicly accessible:

1. Visit: https://vercel.com/tonadun-gmailcoms-projects/useless/settings/deployment-protection
2. Under "Deployment Protection", select **"Standard Protection: None"**
3. Click **Save**

This allows ChatGPT and other services to access your MCP server without authentication.

---

## Step 2: Get Your Production URL

After disabling protection, you'll have access to:
- **Deployment URL**: `https://useless-9z6ie2kqs-tonadun-gmailcoms-projects.vercel.app`
- **Production URL**: `https://useless.vercel.app` (if available)

Test the endpoint:
```bash
curl https://useless.vercel.app/
```

Expected response:
```json
{
  "name": "Useless - Cross-Occupational Learning MCP Server",
  "version": "1.0.0",
  "status": "running",
  "cards": 15,
  "endpoint": "/mcp"
}
```

---

## Step 3: Set Up app-sdk.com Proxy (2 Options)

### **Option A: Using Vercel (Recommended)**

If your app-sdk.com is hosted on Vercel:

1. Go to your **app-sdk.com project** on Vercel
2. Create or edit `vercel.json` in the root:

```json
{
  "rewrites": [
    {
      "source": "/mcp/useless/:path*",
      "destination": "https://useless.vercel.app/:path*"
    }
  ]
}
```

3. Deploy the changes:
```bash
cd /path/to/app-sdk-project
vercel --prod
```

### **Option B: Using Next.js Config**

If app-sdk.com uses Next.js, add to `next.config.js`:

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/mcp/useless/:path*',
        destination: 'https://useless.vercel.app/:path*',
      },
    ]
  },
}
```

---

## Step 4: Test the Integration

After setting up the proxy:

1. **Test Health Endpoint**:
   ```bash
   curl https://app-sdk.com/mcp/useless
   ```

2. **Test MCP Endpoint**:
   ```bash
   curl -X POST https://app-sdk.com/mcp/useless/mcp \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "initialize",
       "params": {}
     }'
   ```

   Expected response:
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "result": {
       "protocolVersion": "2024-11-05",
       "capabilities": {
         "tools": {},
         "resources": {}
       },
       "serverInfo": {
         "name": "useless",
         "version": "1.0.0"
       }
     }
   }
   ```

---

## Step 5: Configure ChatGPT

1. Open ChatGPT: https://chatgpt.com
2. Go to **Settings → Apps & Connections → Advanced Options**
3. Enable **Developer Mode**
4. Click **Add App**:
   - **Name**: Useless Learning
   - **Description**: Cross-occupational learning with custom UI carousel
   - **MCP Server URL**: `https://app-sdk.com/mcp/useless/mcp`
   - **Authentication**: None
5. Click **Save**
6. **IMPORTANT**: Click **Refresh** on the app card
7. Test: "Tell me something useless"

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                   ChatGPT                           │
│                                                     │
│  User asks: "Tell me something useless"            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              app-sdk.com (Main Site)                │
│                                                     │
│  Proxy: /mcp/useless/* → useless.vercel.app/*      │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           useless.vercel.app (MCP Server)           │
│                                                     │
│  • Node.js Express server                           │
│  • 15 learning cards                                │
│  • 3-card carousel component                        │
│  • Action buttons (Learn More, Related, Share)      │
└─────────────────────────────────────────────────────┘
```

---

## Features Deployed

✅ **15 Learning Cards**:
- Aircraft Engineer, Chef, Architect, Electrician, Paramedic
- Barista, Firefighter, Pilot, Photographer, Surgeon
- Mechanic, Sommelier, Welder, Meteorologist, Interpreter, Locksmith

✅ **3-Card Carousel**:
- Horizontal sliding animation
- Navigation arrows and dot indicators
- Compact card design (shows first 5 steps)

✅ **Action Buttons**:
- 📚 Learn More - Request more details
- 🔗 Related - Get similar cards
- 📤 Share - Copy to clipboard

✅ **Dark Mode Support**: Adapts to ChatGPT theme

---

## Troubleshooting

### Issue: "Authentication Required" when accessing URL
**Solution**: Disable Deployment Protection in Vercel settings (Step 1 above)

### Issue: ChatGPT shows text instead of cards
**Solution**: Refresh the app in ChatGPT settings after deployment

### Issue: 404 on /mcp/useless
**Solution**: Ensure rewrites are properly configured in app-sdk.com project

### Issue: CORS errors
**Solution**: The server already has CORS enabled. Check browser console for specific errors.

---

## Updating the Deployment

To deploy changes:

```bash
cd /Users/nadunliyanage/Documents/SS/S226-Useless/Project/useless
vercel --prod
```

After deployment:
1. ChatGPT will automatically use the updated version
2. No need to refresh unless you change tool metadata

---

## Support

- **Vercel Dashboard**: https://vercel.com/tonadun-gmailcoms-projects/useless
- **Deployment URL**: https://useless-9z6ie2kqs-tonadun-gmailcoms-projects.vercel.app
- **Target Production URL**: https://app-sdk.com/mcp/useless

For issues, check:
1. Vercel deployment logs
2. Browser console (F12) when testing in ChatGPT
3. Network tab to see MCP requests/responses
