# Drivers - Professional Driver Booking App

A ChatGPT App built with MCP (Model Context Protocol) and Apps SDK featuring custom UI components. Find and book professional drivers in your area with detailed profiles, ratings, and real-time availability.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![MCP](https://img.shields.io/badge/MCP-2024--11--05-green)
![Apps SDK](https://img.shields.io/badge/Apps%20SDK-Custom%20UX-orange)

## 🎯 Overview

**Drivers** helps you find and book professional drivers in your area. Browse driver profiles with ratings, vehicle information, hourly rates, and weekly availability schedules. Each driver card is displayed in a custom interactive UI component that renders directly in ChatGPT.

### Key Features

✅ **Custom UI Components** - Interactive driver profile cards with modern design
✅ **MCP Protocol** - Standards-compliant server with resources and tools
✅ **Apps SDK Integration** - Proper component templates using `text/html+skybridge`
✅ **Structured Content** - Clean data flow from server to component via `window.openai`
✅ **Driver Profiles** - Complete information including ratings, vehicle details, and availability
✅ **Search & Filter** - Find drivers by city, vehicle type, and more

## 📁 Project Structure

```
drivers/
├── src/
│   └── index.js              # MCP server with driver search and booking tools
├── web/
│   ├── src/
│   │   └── component.js      # Vanilla JS component
│   └── dist/
│       └── component.js      # Built component bundle
├── data/
│   └── drivers.json          # Driver profiles and availability data
├── Dockerfile                # Production container
├── fly.toml                  # Fly.io deployment config
├── vercel.json               # Vercel deployment config
├── package.json              # Server dependencies
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone and install
cd /path/to/drivers
npm install

# Build component (optional - already built)
cp web/src/component.js web/dist/component.js
```

### 2. Local Testing

Start the MCP server:
```bash
npm start
```

The server runs on `http://localhost:3000` with the following endpoints:
- `/` - Health check
- `/mcp` - MCP protocol endpoint (POST)

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Or deploy to production
vercel --prod
```

Your server will be live at your Vercel URL (e.g., `https://drivers.vercel.app/mcp`)

### 4. Deploy to Fly.io (Alternative)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Deploy (uses existing fly.toml)
flyctl deploy --app drivers

# Check status
flyctl status --app drivers
```

Your server will be live at: `https://drivers.fly.dev/mcp`

### 5. Connect to ChatGPT

1. Open [ChatGPT](https://chatgpt.com)
2. Go to **Settings → Apps & Connections → Advanced Options**
3. Enable **Developer Mode**
4. Click **Add App**:
   - **Name**: Drivers
   - **Description**: Find and book professional drivers
   - **MCP Server URL**: `https://your-deployment-url.vercel.app/mcp`
   - **Authentication**: None
5. **Refresh the app** after adding (important for component support!)
6. Test: "Find me a driver in San Francisco"

## 🎨 How It Works

### Architecture

```
ChatGPT → MCP Protocol → Express Server → Component Resource
                ↓              ↓                    ↓
           tools/list    structuredContent    HTML Template
                ↓              ↓                    ↓
         Tool Metadata    window.openai      Vanilla JS UI
```

### 1. MCP Server (`src/index.js`)

The server implements four MCP methods:

#### `initialize`
Returns server capabilities and metadata.

#### `resources/list`
Advertises available UI components (driver profile cards).

#### `resources/read`
Serves the component HTML template with driver data.

#### `tools/list`
Defines available tools:
- `search_drivers` - Find drivers by location and vehicle type
- `list_all_drivers` - List all available drivers
- `get_driver_details` - Get detailed driver profile and availability

#### `tools/call`
Returns structured data for the component including driver profiles.

### 2. Component (`web/src/component.js`)

A vanilla JavaScript component that:

1. **Reads data** from `window.openai.toolOutput`
2. **Listens for theme changes** via `openai:set_globals` events
3. **Renders** driver profile cards with ratings, vehicle info, and availability
4. **Supports dark mode** by reading `window.openai.theme`

### 3. Data Flow

```
Tool Call → structuredContent → ChatGPT → window.openai.toolOutput → Component
```

## 🛠️ Available Tools

### `search_drivers`
Search for available drivers in your area.

**Parameters** (all optional):
- `city` - Filter by city (e.g., "San Francisco")
- `vehicleType` - Filter by vehicle type (e.g., "Sedan", "SUV", "Van")

Returns up to 3 driver profiles with complete information.

### `list_all_drivers`
List all available drivers with basic information including ratings and rates.

### `get_driver_details`
Get detailed information about a specific driver.

**Parameters**:
- `driverId` - Driver ID (required, e.g., "driver-001")

Returns complete driver profile with weekly availability schedule.

## 📊 Driver Profiles

Current driver database includes profiles with:

- **Personal Info**: Name, photo, years of experience
- **Ratings**: Star rating and total number of rides
- **Vehicle**: Type, model, color, license plate
- **Service Area**: City, state, service radius
- **Pricing**: Hourly rate
- **Specialties**: Airport transfers, family trips, executive transport, etc.
- **Languages**: Multiple language support
- **Availability**: Weekly schedule with time slots

### Adding New Drivers

Edit `data/drivers.json`:

```json
{
  "id": "driver-xxx",
  "name": "Driver Name",
  "photo": "https://unsplash.com/photo-id",
  "rating": 4.8,
  "totalRides": 500,
  "yearsExperience": 5,
  "vehicle": {
    "type": "Sedan",
    "model": "Toyota Camry 2023",
    "licensePlate": "ABC-1234",
    "color": "Silver"
  },
  "serviceArea": {
    "city": "San Francisco",
    "state": "CA",
    "radius": 25
  },
  "hourlyRate": 45,
  "specialties": ["Airport transfers", "Business trips"],
  "languages": ["English", "Spanish"],
  "availability": {
    "monday": ["09:00-12:00", "14:00-18:00"],
    "tuesday": ["09:00-12:00", "14:00-18:00"],
    ...
  },
  "bio": "Professional driver description..."
}
```

## 🎨 Component Styling

The UI component features:

- **Modern Card Design** - Clean, professional driver profile cards
- **Dark Mode Support** - Adapts to ChatGPT's theme
- **Responsive Design** - Works on desktop and mobile
- **Carousel Navigation** - Browse multiple driver profiles
- **Rating Display** - Visual star ratings and review counts
- **Availability Calendar** - Weekly schedule display

## 🔧 Development

### Local Development

```bash
# Run with auto-reload
npm run dev
```

### Component Development

1. Edit `web/src/component.js`
2. Copy to dist: `cp web/src/component.js web/dist/component.js`
3. Redeploy to Vercel: `vercel --prod`
4. **Refresh app in ChatGPT** (Settings → Apps → Refresh)

### Testing the MCP Server

Test endpoints directly:

```bash
# Health check
curl https://your-app.vercel.app/

# MCP initialize
curl -X POST https://your-app.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# List resources
curl -X POST https://your-app.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"resources/list","params":{}}'
```

## 🔑 Key Implementation Details

### Why `text/html+skybridge`?

This is the **official Apps SDK MIME type** for component templates. Regular `text/html` won't work - ChatGPT specifically looks for `text/html+skybridge` to identify renderable components.

### Why `structuredContent`?

The Apps SDK documentation specifies that `structuredContent` in the tool response is automatically mapped to `window.openai.toolOutput` in the component iframe. This creates a clean data contract between server and UI.

### Why Vanilla JS instead of React?

- **Bundle size**: 4KB vs 1MB (250x smaller)
- **No build step**: Direct copy from src to dist
- **No dependencies**: Pure JavaScript
- **Fast loading**: Instant iframe initialization

### Component Refresh Requirement

**Critical**: After deploying server changes that affect component metadata (like `_meta` fields), you MUST refresh the app in ChatGPT's developer settings. ChatGPT caches tool and resource metadata aggressively.

## 📝 API Reference

### MCP Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `initialize` | Get server capabilities | `{ capabilities, serverInfo }` |
| `resources/list` | List available components | `{ resources: [...] }` |
| `resources/read` | Get component HTML | `{ contents: [...] }` |
| `tools/list` | List available tools | `{ tools: [...] }` |
| `tools/call` | Execute a tool | `{ content, structuredContent }` |

### Component API (window.openai)

| Property | Type | Description |
|----------|------|-------------|
| `toolOutput` | Object | Data from `structuredContent` |
| `theme` | String | `'light'` or `'dark'` |
| `displayMode` | String | `'inline'`, `'fullscreen'`, or `'pip'` |
| `locale` | String | User's locale (e.g., `'en-US'`) |
| `callTool()` | Function | Call MCP tools from component |
| `sendFollowupMessage()` | Function | Insert message into conversation |

## 🐛 Troubleshooting

### Component not rendering

1. **Refresh the app** in ChatGPT developer settings
2. Check Vercel logs for `resources/read` requests
3. Verify component bundle size: `ls -lh web/dist/component.js`
4. Test resource endpoint directly with curl

### ChatGPT summarizing instead of showing component

- This means the resource isn't being fetched
- **Solution**: Delete and re-add the app in ChatGPT
- Ensure MIME type is exactly `text/html+skybridge`

### Deployment Issues

- Check Vercel deployment logs
- Verify all files are included in the deployment
- Test the health check endpoint first

## 📚 Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [ChatGPT Apps SDK](https://platform.openai.com/docs/guides/apps-sdk)
- [Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples)
- [Vercel Docs](https://vercel.com/docs)
- [Fly.io Docs](https://fly.io/docs/)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add more driver profiles
- Improve component styling
- Enhance server features
- Add booking functionality
- Integrate payment gateways
- Fix bugs

## ✨ Acknowledgments

Built with:
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [ChatGPT Apps SDK](https://platform.openai.com/docs/guides/apps-sdk)
- [Express.js](https://expressjs.com/)
- [Vercel](https://vercel.com/)

---

**Find your perfect driver today!** 🚗
