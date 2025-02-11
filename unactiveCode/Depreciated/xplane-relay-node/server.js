// Import WebSocket and HTTP modules
const WebSocket = require("ws");
const http = require("http");
const httpProxy = require("http-proxy");

// Configurations
const SERVER_PORT = 8080; // WebSocket server port
const RELAY_URL = "ws://localhost:8086/api/v1"; // WebSocket relay server URL
const HTTP_TARGET = "http://localhost:8086"; // HTTP server on port 8086
const SERVER_IP = "10.0.0.2"; // Server IP
const WEBSOCKET_LOG = "[WEBSOCKET LOG]"; // Log prefix

let globalID = 0;

// Logging functions
function httpLog(name) {
  console.log(`[HTTP LOG] ${name}`);
}

function websocketLog(name) {
  console.log(`[WEBSOCKET LOG] ${name}`);
}

// WEBSOCKET SERVER ----------------------------------------------------------------
// Set up the WebSocket server
const server = new WebSocket.Server({ port: SERVER_PORT });
websocketLog(`WebSocket server is running on ws://${SERVER_IP}:${SERVER_PORT}`);

// Connect to the relay WebSocket server
const xplaneSocket = new WebSocket(RELAY_URL);
websocketLog(`Connecting to X-Plane WebSocket at ${RELAY_URL}`);

// Track connected clients (stations)
const connectedClients = new Set();

// Handle new client connections to the WebSocket server
server.on("connection", (ws) => {
  connectedClients.add(ws);
  websocketLog(`New client connected (${connectedClients.size} total)`);

  ws.on("message", (message) => {
    // Parse the incoming message and replace req_id
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      console.error(`${WEBSOCKET_LOG} Failed to parse incoming message:`, error);
      return;
    }

    globalID++; // Increment globalID
    parsedMessage.req_id = globalID; // Replace req_id with globalID

    // Forward the message to the relay WebSocket server
    if (xplaneSocket.readyState === WebSocket.OPEN) {
      websocketLog(`Forwarding message to X-Plane server: ${JSON.stringify(parsedMessage)}`);
      xplaneSocket.send(JSON.stringify(parsedMessage));
    } else {
      console.error(`${WEBSOCKET_LOG} Relay server is not connected`);
    }
  });

  ws.on("close", () => {
    connectedClients.delete(ws);
    websocketLog(`Client disconnected (${connectedClients.size} total)`);
  });

  ws.on("error", (error) => {
    console.error(`${WEBSOCKET_LOG} Client WebSocket error: ${error}`);
  });
});

xplaneSocket.on("message", (message) => {
  websocketLog(`Message from X-Plane server: ${message}`);
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

xplaneSocket.on("open", () => {
  websocketLog(`Connected to X-Plane WebSocket server`);
});

xplaneSocket.on("error", (error) => {
  console.error(`${WEBSOCKET_LOG} X-Plane WebSocket error: ${error}`);
});

xplaneSocket.on("close", () => {
  websocketLog(`X-Plane WebSocket server disconnected`);
});

// HTTP RELAY SERVER ----------------------------------------------------------------
const HTTP_SERVER_PORT = 8081;

// Create an HTTP proxy server
const proxy = httpProxy.createProxyServer({
  target: HTTP_TARGET, // Forward to HTTP server on port 8086
  ws: true, // Enable WebSocket proxying
});

// Middleware to inject globalID into HTTP requests
proxy.on("proxyReq", (proxyReq, req, res, options) => {
  if (req.method === "POST") {
    let body = [];

    // Collect the request data
    req.on("data", (chunk) => {
      body.push(chunk);
    });

    req.on("end", () => {
      body = Buffer.concat(body).toString();

      try {
        const parsedMessage = JSON.parse(body);

        globalID++; // Increment globalID
        parsedMessage.req_id = globalID; // Replace req_id with globalID

        const updatedBody = JSON.stringify(parsedMessage);
        proxyReq.setHeader("Content-Length", Buffer.byteLength(updatedBody));
        proxyReq.write(updatedBody);
        proxyReq.end();
      } catch (error) {
        console.error(`[HTTP LOG] Error processing HTTP request body: ${error}`);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

    req.on("error", (error) => {
      console.error(`[HTTP LOG] Error in HTTP request: ${error}`);
    });
  }
});

// Create the HTTP server
const httpServer = http.createServer((req, res) => {
  httpLog(`Received HTTP request for ${req.url}`);
  proxy.web(req, res, (err) => {
    console.error(`[HTTP LOG] Proxy error:`, err);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Bad Gateway" }));
  });
});

// Handle WebSocket upgrades
httpServer.on("upgrade", (req, socket, head) => {
  websocketLog(`WebSocket upgrade request for ${req.url}`);
  proxy.ws(req, socket, head, (err) => {
    console.error(`[WEBSOCKET LOG] Proxy WebSocket error:`, err);
    socket.destroy();
  });
});

// Start the HTTP server
httpServer.listen(HTTP_SERVER_PORT, SERVER_IP, () => {
  httpLog(`HTTP proxy server is running on http://${SERVER_IP}:${HTTP_SERVER_PORT}, forwarding to ${HTTP_TARGET}`);
});
