#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

// Initialize Stripe with secret key
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
  : null;

if (!stripe) {
  console.warn('⚠️  Stripe not initialized: STRIPE_SECRET_KEY not set');
  console.warn('   Payment functionality will send follow-up messages instead');
} else {
  console.log('✓ Stripe initialized in', process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE', 'mode');
}

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
async function handleToolCall(toolName, args) {
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

    case 'create_payment_session': {
      if (!stripe) {
        throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY environment variable.');
      }

      const { instructorId, packageHours, email, selectedDate } = args;

      // Find the instructor
      const instructor = driversData.drivers.find(d => d.id === instructorId);
      if (!instructor) {
        throw new Error('Instructor not found');
      }

      // Calculate price with discount
      const packages = [
        { hours: 1, discount: 0 },
        { hours: 2, discount: 0 },
        { hours: 4, discount: 5 },
        { hours: 10, discount: 10 },
        { hours: 20, discount: 15 }
      ];

      const selectedPackage = packages.find(p => p.hours === packageHours) || packages[0];
      const basePrice = instructor.pricePerHour * packageHours;
      const discount = (basePrice * selectedPackage.discount) / 100;
      const totalCost = basePrice - discount;
      const amountInPence = Math.round(totalCost * 100);

      // Create Stripe Checkout Session
      const baseUrl = process.env.BASE_URL || 'https://drivers-kjbv0h8mn-tonadun-gmailcoms-projects.vercel.app';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'gbp',
              product_data: {
                name: `Driving Lessons with ${instructor.name}`,
                description: `${packageHours} hour${packageHours > 1 ? 's' : ''} of driving lessons${selectedDate ? ` on ${selectedDate}` : ''}`,
              },
              unit_amount: amountInPence,
            },
            quantity: 1,
          },
        ],
        metadata: {
          instructorId: instructor.id,
          instructorName: instructor.name,
          packageHours: packageHours.toString(),
          selectedDate: selectedDate || '',
          customerEmail: email,
        },
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/payment-cancelled`,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Payment session created for ${packageHours} hour${packageHours > 1 ? 's' : ''} with ${instructor.name}. Total: £${totalCost.toFixed(2)}`,
          },
        ],
        structuredContent: {
          sessionId: session.id,
          url: session.url,
          totalCost,
          instructor: instructor.name,
          packageHours,
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
    stripeEnabled: !!stripe,
  });
});

// Create Stripe Checkout Session (opens in new window via openExternal)
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { instructorId, packageHours, email, selectedDate } = req.body;

    if (!stripe) {
      return res.status(503).json({
        error: 'Stripe not configured',
        message: 'Payment processing is not available. Please contact support.'
      });
    }

    // Find the instructor
    await ensureInitialized();
    const instructor = driversData.drivers.find(d => d.id === instructorId);

    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    // Calculate price with discount
    const packages = [
      { hours: 1, discount: 0 },
      { hours: 2, discount: 0 },
      { hours: 4, discount: 5 },
      { hours: 10, discount: 10 },
      { hours: 20, discount: 15 }
    ];

    const selectedPackage = packages.find(p => p.hours === packageHours) || packages[0];
    const basePrice = instructor.pricePerHour * packageHours;
    const discount = (basePrice * selectedPackage.discount) / 100;
    const totalCost = basePrice - discount;

    // Convert GBP to pence for Stripe (Stripe uses smallest currency unit)
    const amountInPence = Math.round(totalCost * 100);

    // Create Stripe Checkout Session
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Driving Lessons with ${instructor.name}`,
              description: `${packageHours} hour${packageHours > 1 ? 's' : ''} of driving lessons${selectedDate ? ` on ${selectedDate}` : ''}`,
            },
            unit_amount: amountInPence,
          },
          quantity: 1,
        },
      ],
      metadata: {
        instructorId: instructor.id,
        instructorName: instructor.name,
        packageHours: packageHours.toString(),
        selectedDate: selectedDate || '',
        customerEmail: email,
      },
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment-cancelled`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Payment Intent error:', error);
    res.status(500).json({
      error: 'Payment error',
      message: error.message
    });
  }
});

// Payment success page
app.get('/payment-success', async (req, res) => {
  const { session_id } = req.query;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          text-align: center;
          max-width: 500px;
        }
        .success-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #4CAF50;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        h1 { color: #1a1a1a; margin: 0 0 16px; }
        p { color: #666; line-height: 1.6; }
        .session-id { font-size: 12px; color: #999; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1>Payment Successful!</h1>
        <p>Thank you for your booking. You will receive a confirmation email shortly with details about your driving lessons.</p>
        <p>The instructor will contact you to schedule your lessons.</p>
        ${session_id ? `<div class="session-id">Session ID: ${session_id}</div>` : ''}
      </div>
    </body>
    </html>
  `);
});

// Payment cancelled page
app.get('/payment-cancelled', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Cancelled</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
        }
        h1 { color: #1a1a1a; margin: 0 0 16px; }
        p { color: #666; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Payment Cancelled</h1>
        <p>Your payment was cancelled. You can return to the chat to try booking again.</p>
      </div>
    </body>
    </html>
  `);
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
                {
                  name: 'create_payment_session',
                  description: 'Create a Stripe payment session for booking driving lessons. Can be initiated by the component.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      instructorId: {
                        type: 'string',
                        description: 'The instructor ID',
                      },
                      packageHours: {
                        type: 'number',
                        description: 'Number of hours in the package (1, 2, 4, 10, or 20)',
                      },
                      email: {
                        type: 'string',
                        description: 'Customer email address',
                      },
                      selectedDate: {
                        type: 'string',
                        description: 'Optional: Selected booking date',
                      },
                    },
                    required: ['instructorId', 'packageHours', 'email'],
                  },
                  _meta: {
                    'openai/canInitiateFromComponent': true,
                    'openai/toolInvocation/invoking': 'Creating payment session...',
                    'openai/toolInvocation/invoked': 'Payment session created',
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
            const result = await handleToolCall(toolName, args);
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
