#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

// Load drivers data
let driversData = null;
let componentCode = null;

async function loadDriversData() {
  try {
    const dataPath = join(__dirname, '..', 'data', 'drivers.json');
    const data = await readFile(dataPath, 'utf-8');
    driversData = JSON.parse(data);
    console.log('Loaded', driversData.drivers.length, 'drivers');
  } catch (error) {
    console.error('Error loading drivers data:', error);
    driversData = { drivers: [] };
  }
}

async function loadComponentBundle() {
  try {
    const componentPath = join(__dirname, '..', 'web', 'dist', 'component.js');
    componentCode = await readFile(componentPath, 'utf-8');
    console.log('Loaded component bundle:', (componentCode.length / 1024).toFixed(0), 'KB');
  } catch (error) {
    console.error('Error loading component bundle:', error);
    console.log('Custom UI will not be available - falling back to text only');
    componentCode = null;
  }
}

// Handle tool calls
function handleToolCall(toolName, args) {
  switch (toolName) {
    case 'search_drivers': {
      // Get 3 random drivers or filter by criteria
      let filteredDrivers = [...driversData.drivers];

      // Filter by city if provided
      if (args?.city) {
        filteredDrivers = filteredDrivers.filter(driver =>
          driver.serviceArea.city.toLowerCase().includes(args.city.toLowerCase())
        );
      }

      // Filter by vehicle type if provided
      if (args?.vehicleType) {
        filteredDrivers = filteredDrivers.filter(driver =>
          driver.vehicle.type.toLowerCase().includes(args.vehicleType.toLowerCase())
        );
      }

      // Get up to 3 drivers
      const selectedDrivers = filteredDrivers.slice(0, 3);

      if (selectedDrivers.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No drivers found matching your criteria. Try searching with different parameters.',
            },
          ],
        };
      }

      // Format drivers as text for fallback
      const formattedDrivers = selectedDrivers.map(driver => `
# 🚗 ${driver.name}

⭐ **${driver.rating}/5.0** (${driver.totalRides} rides) | ${driver.yearsExperience} years experience

**Vehicle:** ${driver.vehicle.model} (${driver.vehicle.color} ${driver.vehicle.type})
**Service Area:** ${driver.serviceArea.city}, ${driver.serviceArea.state} (${driver.serviceArea.radius} mile radius)
**Hourly Rate:** $${driver.hourlyRate}/hour

**Specialties:** ${driver.specialties.join(', ')}
**Languages:** ${driver.languages.join(', ')}

${driver.bio}
`).join('\n---\n\n');

      const fullText = `${formattedDrivers}\n\n*Book a professional driver today!* 🚗`;

      return {
        content: [
          {
            type: 'text',
            text: fullText,
          },
        ],
        structuredContent: {
          drivers: selectedDrivers,
        },
      };
    }

    case 'list_all_drivers': {
      const driversList = driversData.drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        rating: driver.rating,
        vehicleType: driver.vehicle.type,
        city: driver.serviceArea.city,
        hourlyRate: driver.hourlyRate,
      }));

      const formattedList = `
# Available Drivers

${driversList.map(driver => `
## ${driver.name}
- **ID:** ${driver.id}
- **Rating:** ${driver.rating}/5.0
- **Vehicle:** ${driver.vehicleType}
- **Location:** ${driver.city}
- **Rate:** $${driver.hourlyRate}/hour
`).join('\n')}

Use \`search_drivers\` to get detailed profiles and availability.
`;

      return {
        content: [
          {
            type: 'text',
            text: formattedList,
          },
        ],
      };
    }

    case 'get_driver_details': {
      const driverId = args?.driverId;
      const driver = driversData.drivers.find(d => d.id === driverId);

      if (!driver) {
        return {
          content: [
            {
              type: 'text',
              text: `Driver not found. Use \`list_all_drivers\` to see available drivers.`,
            },
          ],
        };
      }

      const formattedDriver = `
# 🚗 ${driver.name}

⭐ **${driver.rating}/5.0** (${driver.totalRides} rides) | ${driver.yearsExperience} years experience

**Vehicle:** ${driver.vehicle.model} (${driver.vehicle.color} ${driver.vehicle.type})
**License Plate:** ${driver.vehicle.licensePlate}
**Service Area:** ${driver.serviceArea.city}, ${driver.serviceArea.state} (${driver.serviceArea.radius} mile radius)
**Hourly Rate:** $${driver.hourlyRate}/hour

**Specialties:** ${driver.specialties.join(', ')}
**Languages:** ${driver.languages.join(', ')}

## About
${driver.bio}

## Weekly Availability
${Object.entries(driver.availability).map(([day, slots]) =>
  `**${day.charAt(0).toUpperCase() + day.slice(1)}:** ${slots.length > 0 ? slots.join(', ') : 'Not available'}`
).join('\n')}
`;

      return {
        content: [
          {
            type: 'text',
            text: formattedDriver,
          },
        ],
        structuredContent: {
          drivers: [driver],
        },
      };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize data on startup
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await loadDriversData();
    await loadComponentBundle();
    initialized = true;
  }
}

// Health check endpoint
app.get('/', async (req, res) => {
  await ensureInitialized();
  res.json({
    name: 'Drivers - Find and Book Drivers MCP Server',
    version: '1.0.0',
    status: 'running',
    drivers: driversData.drivers.length,
    endpoint: '/mcp',
  });
});

// MCP endpoint - POST only for proper MCP protocol
app.post('/mcp', async (req, res) => {
  await ensureInitialized();
    try {
      const request = req.body;
      console.log('MCP request:', request.method);

      let response;

      switch (request.method) {
        case 'initialize':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {},
              },
              serverInfo: {
                name: 'drivers',
                version: '1.0.0',
                description: 'Find and book professional drivers in your area. Browse available drivers, view their profiles with ratings and availability, and book rides for any occasion.',
              },
            },
          };
          break;

        case 'resources/list':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              resources: [
                {
                  uri: 'ui://widget/driver-card.html',
                  name: 'Driver Profile Widget',
                  description: 'Interactive driver profile component with booking information',
                  mimeType: 'text/html+skybridge',
                },
              ],
            },
          };
          break;

        case 'resources/read':
          if (request.params?.uri === 'ui://widget/driver-card.html') {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                contents: [
                  {
                    uri: 'ui://widget/driver-card.html',
                    mimeType: 'text/html+skybridge',
                    text: `
<div id="root"></div>
<script type="module">${componentCode}</script>
                    `.trim(),
                    _meta: {
                      'openai/widgetPrefersBorder': false,
                      'openai/widgetDescription': 'Displays driver profiles with ratings, vehicle information, availability, and booking options.',
                    },
                  },
                ],
              },
            };
          } else {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32602,
                message: `Unknown resource: ${request.params?.uri}`,
              },
            };
          }
          break;

        case 'tools/list':
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: [
                {
                  name: 'search_drivers',
                  title: 'Search Drivers',
                  description: 'Search for available drivers in your area. Use when user asks to: find drivers, book a driver, need transportation, search for rides, or asks about available drivers. Returns driver profiles with ratings, vehicle info, and availability.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      city: {
                        type: 'string',
                        description: 'Optional: Filter by city (e.g., "San Francisco")',
                      },
                      vehicleType: {
                        type: 'string',
                        description: 'Optional: Filter by vehicle type (e.g., "Sedan", "SUV", "Van", "Luxury")',
                      },
                    },
                  },
                  _meta: {
                    'openai/outputTemplate': 'ui://widget/driver-card.html',
                    'openai/toolInvocation/invoking': 'Searching for drivers...',
                    'openai/toolInvocation/invoked': 'Driver profiles displayed',
                  },
                },
                {
                  name: 'list_all_drivers',
                  description: 'List all available drivers with their basic information including ratings, vehicle types, and rates.',
                  inputSchema: {
                    type: 'object',
                    properties: {},
                  },
                },
                {
                  name: 'get_driver_details',
                  description: 'Get detailed information about a specific driver including full availability schedule and complete profile.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      driverId: {
                        type: 'string',
                        description: 'The driver ID (e.g., "driver-001")',
                      },
                    },
                    required: ['driverId'],
                  },
                  _meta: {
                    'openai/outputTemplate': 'ui://widget/driver-card.html',
                    'openai/toolInvocation/invoking': 'Loading driver profile...',
                    'openai/toolInvocation/invoked': 'Driver profile displayed',
                  },
                },
              ],
            },
          };
          break;

        case 'tools/call':
          const toolName = request.params?.name;
          const args = request.params?.arguments || {};

          try {
            const result = handleToolCall(toolName, args);
            response = {
              jsonrpc: '2.0',
              id: request.id,
              result,
            };
          } catch (error) {
            response = {
              jsonrpc: '2.0',
              id: request.id,
              error: {
                code: -32603,
                message: error.message,
              },
            };
          }
          break;

        default:
          response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }

      res.json(response);
    } catch (error) {
      console.error('MCP request error:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: error.message,
        },
      });
    }
  });

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Drivers MCP Server running on http://0.0.0.0:${PORT}`);
    console.log(`MCP endpoint available at http://0.0.0.0:${PORT}/mcp`);
    console.log(`Health check at http://0.0.0.0:${PORT}/`);
  });
}

// Export for Vercel
export default app;
