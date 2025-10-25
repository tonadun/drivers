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
      // Get all instructors or filter by criteria
      let filteredDrivers = [...driversData.drivers];

      // Filter by area/city if provided
      if (args?.city) {
        filteredDrivers = filteredDrivers.filter(driver =>
          driver.area.toLowerCase().includes(args.city.toLowerCase())
        );
      }

      // Filter by transmission if provided
      if (args?.vehicleType) {
        filteredDrivers = filteredDrivers.filter(driver =>
          driver.transmission.toLowerCase().includes(args.vehicleType.toLowerCase())
        );
      }

      // Get all matching instructors
      const selectedDrivers = filteredDrivers;

      if (selectedDrivers.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No instructors found matching your criteria. Try searching with different parameters.',
            },
          ],
        };
      }

      // Format instructors as text for fallback
      const formattedDrivers = selectedDrivers.map(driver => `
# 🚗 ${driver.name}

⭐ **${driver.rating}/5.0** (${driver.totalReviews} reviews) | ${driver.yearsExperience} years experience

**Transmission:** ${driver.transmission}
**Area:** ${driver.area} (${driver.postcode})
**Price:** £${driver.pricePerHour}/hour

**Specialties:** ${driver.specialties.join(', ')}
**Languages:** ${driver.languages.join(', ')}

${driver.bio}
`).join('\n---\n\n');

      const fullText = `${formattedDrivers}\n\n*Book a professional driving instructor today!* 🚗`;

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
        transmission: driver.transmission,
        area: driver.area,
        pricePerHour: driver.pricePerHour,
      }));

      const formattedList = `
# Available Driving Instructors

${driversList.map(driver => `
## ${driver.name}
- **ID:** ${driver.id}
- **Rating:** ${driver.rating}/5.0
- **Transmission:** ${driver.transmission}
- **Location:** ${driver.area}
- **Rate:** £${driver.pricePerHour}/hour
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
              text: `Instructor not found. Use \`list_all_drivers\` to see available instructors.`,
            },
          ],
        };
      }

      const formattedDriver = `
# 🚗 ${driver.name}

⭐ **${driver.rating}/5.0** (${driver.totalReviews} reviews) | ${driver.yearsExperience} years experience

**Transmission:** ${driver.transmission}
**Gender:** ${driver.gender}
**Area:** ${driver.area} (${driver.postcode})
**Price:** £${driver.pricePerHour}/hour

**Specialties:** ${driver.specialties.join(', ')}
**Languages:** ${driver.languages.join(', ')}

## About
${driver.bio}

## Weekly Availability
${Object.entries(driver.weeklyAvailability).map(([day, available]) =>
  `**${day.charAt(0).toUpperCase() + day.slice(1)}:** ${available ? 'Available' : 'Not available'}`
).join('\n')}

**Time Preference:** ${driver.timePreference.join(', ')}
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
                name: 'driving-instructors',
                version: '1.0.0',
                description: 'Find and book UK driving instructors in your area. Filter by transmission (Manual/Automatic), view ratings and availability, compare prices, and book lessons.',
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
                  name: 'Driving Instructor Finder',
                  description: 'Interactive UK driving instructor finder with filters, sorting, and booking',
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
                      'openai/widgetDescription': 'UK driving instructor finder with filters (Manual/Automatic, time, day, gender), sorting options, and booking functionality.',
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
                  title: 'Find Driving Instructors',
                  description: 'Find UK driving instructors in your area. Use when user asks to: find instructors, book lessons, learn to drive, or asks about driving lessons. Returns instructor profiles with ratings, transmission type, prices, and availability.',
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
                    'openai/toolInvocation/invoking': 'Searching for driving instructors...',
                    'openai/toolInvocation/invoked': 'Instructor profiles displayed',
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
