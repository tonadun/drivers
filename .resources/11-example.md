Examples
End-to-end Apps SDK examples.

Overview
The Pizzaz demo app bundles a handful of UI components so you can see the full tool surface area end-to-end. The following sections walk through the MCP server and the component implementations that power those tools. You can find the “Pizzaz” demo app and other examples in our examples repository on GitHub. https://github.com/openai/openai-apps-sdk-examples

Use these examples as blueprints when you assemble your own app.


Apps SDK Examples Gallery
MIT License

This repository showcases example UI components to be used with the Apps SDK, as well as example MCP servers that expose a collection of components as tools. It is meant to be used as a starting point and source of inspiration to build your own apps for ChatGPT.

MCP + Apps SDK overview
The Model Context Protocol (MCP) is an open specification for connecting large language model clients to external tools, data, and user interfaces. An MCP server exposes tools that a model can call during a conversation and returns results according to the tool contracts. Those results can include extra metadata—such as inline HTML—that the Apps SDK uses to render rich UI components (widgets) alongside assistant messages.

Within the Apps SDK, MCP keeps the server, model, and UI in sync. By standardizing the wire format, authentication, and metadata, it lets ChatGPT reason about your connector the same way it reasons about built-in tools. A minimal MCP integration for Apps SDK implements three capabilities:

List tools – Your server advertises the tools it supports, including their JSON Schema input/output contracts and optional annotations (for example, readOnlyHint).
Call tools – When a model selects a tool, it issues a call_tool request with arguments that match the user intent. Your server executes the action and returns structured content the model can parse.
Return widgets – Alongside structured content, return embedded resources in the response metadata so the Apps SDK can render the interface inline in the Apps SDK client (ChatGPT).
Because the protocol is transport agnostic, you can host the server over Server-Sent Events or streaming HTTP—Apps SDK supports both.

The MCP servers in this demo highlight how each tool can light up widgets by combining structured payloads with _meta.openai/outputTemplate metadata returned from the MCP servers.

Repository structure
src/ – Source for each widget example.
assets/ – Generated HTML, JS, and CSS bundles after running the build step.
pizzaz_server_node/ – MCP server implemented with the official TypeScript SDK.
pizzaz_server_python/ – Python MCP server that returns the Pizzaz widgets.
solar-system_server_python/ – Python MCP server for the 3D solar system widget.
build-all.mts – Vite build orchestrator that produces hashed bundles for every widget entrypoint.
Prerequisites
Node.js 18+
pnpm (recommended) or npm/yarn
Python 3.10+ (for the Python MCP server)
Install dependencies
Clone the repository and install the workspace dependencies:

pnpm install
Using npm or yarn? Install the root dependencies with your preferred client and adjust the commands below accordingly.

Build the components gallery
The components are bundled into standalone assets that the MCP servers serve as reusable UI resources.

pnpm run build
This command runs build-all.mts, producing versioned .html, .js, and .css files inside assets/. Each widget is wrapped with the CSS it needs so you can host the bundles directly or ship them with your own server.

To iterate on your components locally, you can also launch the Vite dev server:

pnpm run dev
Serve the static assets
If you want to preview the generated bundles without the MCP servers, start the static file server after running a build:

pnpm run serve
The assets are exposed at http://localhost:4444 with CORS enabled so that local tooling (including MCP inspectors) can fetch them.

Run the MCP servers
The repository ships several demo MCP servers that highlight different widget bundles:

Pizzaz (Node & Python) – pizza-inspired collection of tools and components
Solar system (Python) – 3D solar system viewer
Every tool response includes plain text content, structured JSON, and _meta.openai/outputTemplate metadata so the Apps SDK can hydrate the matching widget.

Pizzaz Node server
cd pizzaz_server_node
pnpm start
Pizzaz Python server
python -m venv .venv
source .venv/bin/activate
pip install -r pizzaz_server_python/requirements.txt
uvicorn pizzaz_server_python.main:app --port 8000
Solar system Python server
python -m venv .venv
source .venv/bin/activate
pip install -r solar-system_server_python/requirements.txt
uvicorn solar-system_server_python.main:app --port 8000
You can reuse the same virtual environment for all Python servers—install the dependencies once and run whichever entry point you need.

Testing in ChatGPT
To add these apps to ChatGPT, enable developer mode, and add your apps in Settings > Connectors.

To add your local server without deploying it, you can use a tool like ngrok to expose your local server to the internet.

For example, once your mcp servers are running, you can run:

ngrok http 8000
You will get a public URL that you can use to add your local server to ChatGPT in Settings > Connectors.

For example: https://<custom_endpoint>.ngrok-free.app/mcp

Once you add a connector, you can use it in ChatGPT conversations.

You can add your app to the conversation context by selecting it in the "More" options.

more-chatgpt

You can then invoke tools by asking something related. For example, for the Pizzaz app, you can ask "What are the best pizzas in town?".

Next steps
Customize the widget data: edit the handlers in pizzaz_server_node/src, pizzaz_server_python/main.py, or the solar system server to fetch data from your systems.
Create your own components and add them to the gallery: drop new entries into src/ and they will be picked up automatically by the build script.
Deploy your MCP server
You can use the cloud environment of your choice to deploy your MCP server.

Include this in the environment variables:

BASE_URL=https://your-server.com
This will be used to generate the HTML for the widgets so that they can serve static assets from this hosted url.

Contributing
You are welcome to open issues or submit PRs to improve this app, however, please note that we may not review all suggestions.

License
This project is licensed under the MIT License. See LICENSE for details.