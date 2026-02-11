Build your ChatGPT UI
Build custom UI components for your ChatGPT app.

Overview
UI components turn structured tool results from your MCP server into a human-friendly UI. Your components run inside an iframe in ChatGPT, talk to the host via the MCP Apps bridge (JSON-RPC over postMessage), and render inline with the conversation.

This is the UI architecture we built for ChatGPT Apps—and then helped standardize as MCP Apps—so you can build once and run your UI across MCP Apps-compatible hosts.

ChatGPT continues to support window.openai for Apps SDK compatibility and optional ChatGPT extensions.

You can also check out the examples repository on GitHub.

Component library
Use the optional UI kit at apps-sdk-ui for ready-made buttons, cards, input controls, and layout primitives that match ChatGPT’s container. It saves time when you want consistent styling without rebuilding base components.

Use the MCP Apps bridge (recommended)
ChatGPT implements the open MCP Apps standard for app UIs. For new apps, use the bridge by default:

Transport: JSON-RPC 2.0 over postMessage.
Tool I/O: ui/notifications/tool-input and ui/notifications/tool-result.
Tool calls: tools/call.
Messaging + context: ui/message and ui/update-model-context.
For a high-level overview and a mapping guide from Apps SDK APIs, see MCP Apps compatibility in ChatGPT.

Receive tool inputs and results
ChatGPT sends tool inputs and results into your iframe as JSON-RPC notifications. For example, tool results arrive as ui/notifications/tool-result:

{
  "jsonrpc": "2.0",
  "method": "ui/notifications/tool-result",
  "params": {
    "content": [],
    "structuredContent": { "tasks": [] }
  }
}

Listen for notifications and re-render from structuredContent:

window.addEventListener(
  "message",
  (event) => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.jsonrpc !== "2.0") return;
    if (message.method !== "ui/notifications/tool-result") return;

    const toolResult = message.params;
    const data = toolResult?.structuredContent;
    // Update UI from `data`.
  },
  { passive: true }
);

Call tools from the UI
To call a tool directly from the UI, send a JSON-RPC request for tools/call. Ensure the tool is available to the UI (app) in its descriptor. By default, tools are available to both the model and the UI; use _meta.ui.visibility to restrict that when needed.

See the quickstart for a minimal request/response implementation using postMessage: Quickstart.

Send a follow-up message
Use ui/message to ask the host to post a message:

window.parent.postMessage(
  {
    jsonrpc: "2.0",
    method: "ui/message",
    params: {
      role: "user",
      content: [
        { type: "text", text: "Draft a tasting itinerary for my picks." },
      ],
    },
  },
  "*"
);

Update model-visible context
When UI state changes in a way the model should see, call ui/update-model-context:

// Requires a JSON-RPC request/response helper.
await rpcRequest("ui/update-model-context", {
  content: [{ type: "text", text: "User selected 3 items." }],
});

Understand the window.openai API
ChatGPT provides window.openai as an Apps SDK compatibility layer and a few ChatGPT-only capabilities. OpenAI extensions are optional—use them when they add material value in ChatGPT, but don’t rely on them for baseline MCP Apps compatibility.

For the full API reference, see Apps SDK Reference.

Upload files from the widget (ChatGPT extension)
Use window.openai.uploadFile(file) to upload a user-selected file and receive a fileId. This currently supports image/png, image/jpeg, and image/webp.

function FileUploadInput() {
  return (
    <input
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={async (event) => {
        const file = event.currentTarget.files?.[0];
        if (!file || !window.openai?.uploadFile) {
          return;
        }

        const { fileId } = await window.openai.uploadFile(file);
        console.log("Uploaded fileId:", fileId);
      }}
    />
  );
}

Download files in the widget (ChatGPT extension)
Use window.openai.getFileDownloadUrl({ fileId }) to retrieve a temporary URL for files that were uploaded by the widget or passed to your tool via file params.

const { downloadUrl } = await window.openai.getFileDownloadUrl({ fileId });
imageElement.src = downloadUrl;

Close the widget (ChatGPT extension)
You can close the widget two ways: from the UI by calling window.openai.requestClose(), or from the server by having your tool response set metadata.openai/closeWidget: true, which instructs the host to hide the widget when that response arrives:

{
  "role": "tool",
  "tool_call_id": "abc123",
  "content": "...",
  "metadata": {
    "openai/closeWidget": true,
    "openai/widgetDomain": "https://myapp.example.com",
    "openai/widgetCSP": {
      "connect_domains": ["https://api.myapp.example.com"],
      "resource_domains": ["https://*.oaistatic.com"],
      "redirect_domains": ["https://checkout.example.com"], // Optional: allow openExternal redirects + return link
      "frame_domains": ["https://*.example.com"] // Optional: allow iframes from these domains
    }
  }
}

Note: By default, widgets cannot render subframes. Setting frame_domains relaxes this and allows your widget to embed iframes from those origins. Apps that use frame_domains are subject to stricter review and are likely to be rejected for broad distribution unless iframe content is core to the use case.

If you want window.openai.openExternal to send users to an external flow (like checkout) and enable a return link to the same conversation, optionally add the destination origin to redirect_domains. ChatGPT will skip the safe-link modal and append a redirectUrl query parameter to the destination so you can route the user back into ChatGPT.

Widget session ID
The host includes a per-widget identifier in tool response metadata as openai/widgetSessionId. Use it to correlate multiple tool calls or logs for the same widget instance while it remains mounted.

Request alternate layouts (ChatGPT extension)
If the UI needs more space—like maps, tables, or embedded editors—ask the host to change the container. window.openai.requestDisplayMode negotiates inline, PiP, or fullscreen presentations.

await window.openai?.requestDisplayMode({ mode: "fullscreen" });
// Note: on mobile, PiP may be coerced to fullscreen

Open a modal (ChatGPT extension)
Use window.openai.requestModal to open a host-controlled modal. You can pass a different UI template from the same app by providing the template URI that you registered on your MCP server with registerResource, or omit template to open the current one.

await window.openai.requestModal({
  template: "ui://widget/checkout.html",
});

Use host-backed navigation
Skybridge (the sandbox runtime) mirrors the iframe’s history into ChatGPT’s UI. Use standard routing APIs—such as React Router—and the host will keep navigation controls in sync with your component.

Router setup (React Router’s BrowserRouter):

export default function PizzaListRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PizzaListApp />}>
          <Route path="place/:placeId" element={<PizzaListApp />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

Programmatic navigation:

const navigate = useNavigate();

function openDetails(placeId: string) {
  navigate(`place/${placeId}`, { replace: false });
}

function closeDetails() {
  navigate("..", { replace: true });
}

Scaffold the component project
Now that you understand the MCP Apps bridge (and optional ChatGPT extensions), it’s time to scaffold your component project.

As best practice, keep the component code separate from your server logic. A common layout is:

app/
  server/            # MCP server (Python or Node)
  web/               # Component bundle source
    package.json
    tsconfig.json
    src/component.tsx
    dist/component.js   # Build output

Create the project and install dependencies (Node 18+ recommended):

cd app/web
npm init -y
npm install react@^18 react-dom@^18
npm install -D typescript esbuild

If your component requires drag-and-drop, charts, or other libraries, add them now. Keep the dependency set lean to reduce bundle size.

Author the React component
Your entry file should mount a component into a root element and render from the latest tool result delivered over the MCP Apps bridge (for example, ui/notifications/tool-result).

We have provided some example apps under the examples page, for example, for a “Pizza list” app, which is a list of pizza restaurants.

Explore the Pizzaz component gallery
We provide a number of example components in the Apps SDK examples. Treat them as blueprints when shaping your own UI:

Pizzaz List – ranked card list with favorites and call-to-action buttons.
Screenshot of the Pizzaz list component
Pizzaz Carousel – embla-powered horizontal scroller that demonstrates media-heavy layouts.
Screenshot of the Pizzaz carousel component
Pizzaz Map – Mapbox integration with fullscreen inspector and host state sync.
Screenshot of the Pizzaz map component
Pizzaz Album – stacked gallery view built for deep dives on a single place.
Screenshot of the Pizzaz album component
Pizzaz Video – scripted player with overlays and fullscreen controls.
Each example shows how to bundle assets, wire host APIs, and structure state for real conversations. Copy the one closest to your use case and adapt the data layer for your tool responses.

React helper hooks
A small hook to subscribe to ui/notifications/tool-result:

type ToolResult = { structuredContent?: unknown } | null;

export function useToolResult() {
  const [toolResult, setToolResult] = useState<ToolResult>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;
      if (message.method !== "ui/notifications/tool-result") return;
      setToolResult(message.params ?? null);
    };

    window.addEventListener("message", onMessage, { passive: true });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return toolResult;
}

Render from toolResult?.structuredContent, and treat it as untrusted input.

Widget localization
The host mirrors the locale to document.documentElement.lang. Use that locale to load translations and format dates/numbers. A simple pattern with react-intl:

import { IntlProvider } from "react-intl";
import en from "./locales/en-US.json";
import es from "./locales/es-ES.json";

const messages: Record<string, Record<string, string>> = {
  "en-US": en,
  "es-ES": es,
};

export function App() {
  const locale = document.documentElement.lang || "en-US";
  return (
    <IntlProvider
      locale={locale}
      messages={messages[locale] ?? messages["en-US"]}
    >
      {/* Render UI with <FormattedMessage> or useIntl() */}
    </IntlProvider>
  );
}

Bundle for the iframe
Once you are done writing your React component, you can build it into a single JavaScript module that the server can inline:

// package.json
{
  "scripts": {
    "build": "esbuild src/component.tsx --bundle --format=esm --outfile=dist/component.js"
  }
}

Run npm run build to produce dist/component.js. If esbuild complains about missing dependencies, confirm you ran npm install in the web/ directory and that your imports match installed package names (e.g., @react-dnd/html5-backend vs react-dnd-html5-backend).

Embed the component in the server response
See the Set up your server docs for how to embed the component in your MCP server response.

Component UI templates are the recommended path for production.

During development you can rebuild the component bundle whenever your React code changes and hot-reload the server.