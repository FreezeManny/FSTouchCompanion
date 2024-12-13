// Import WebSocket module
const WebSocket = require("ws");

// Configurations
const SERVER_PORT = 8080; // Port for the WebSocket server
const RELAY_URL = "ws://localhost:8086/api/v1"; // URL of the relay WebSocket server
const SERVER_IP = "10.0.0.2";
const WEBSOCKET_LOG = "[WEBSOCKET LOG]"; // Log prefix

// Import required modules
const http = require("http");
const { request } = require("http");
const { URL } = require("url");

let globalID = 0;

function httpLog(name) {
  console.log(`[HTTP LOG] ${name}`);
}

function websocketLog(name) {
  console.log(`[WEBSOCKET LOG] ${name}`);
}

// Configuration
const PORT = 8081; // Port for this server
const LOCAL_API_HOST = "localhost"; // Host of the local API
const LOCAL_API_PORT = 8086; // Port of the local API
const HTTP_LOG = "[HTTP LOG]"; // Log prefix

//----------------------------------------------------------------
// Create the server
const httpServer = http.createServer((req, res) => {
  // Parse the incoming request URL
  const reqUrl = new URL(req.url, `http://${LOCAL_API_HOST}:${PORT}`);

  // Extract and log the `filter[name]` query parameter if present
  const filterName = reqUrl.searchParams.get("filter[name]");
  if (filterName) {
    //httpLog(`Received filter[name]: ${filterName}`);
  }

  // Options to forward the request to the local API
  const options = {
    hostname: LOCAL_API_HOST,
    port: LOCAL_API_PORT,
    path: reqUrl.pathname + reqUrl.search, // Forward full path with query string
    method: req.method,
    headers: req.headers,
  };

  // Forward the request to the local API
  const proxy = request(options, (localRes) => {
    // Set the headers and status code from the local API response
    res.writeHead(localRes.statusCode, localRes.headers);

    // Pipe the data from the local API response to the client
    localRes.pipe(res);
    //httpLog(`Proxied response with status: ${localRes.statusCode}`);
  });

  // Handle errors during proxying
  proxy.on("error", (error) => {
    console.error(`${HTTP_LOG} Error proxying request:`, error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  });

  // Pipe the incoming request data to the proxy request
  req.pipe(proxy);
  httpLog(`Proxied request to: ${options.hostname}:${options.port}${options.path}`);
});

// Start the server
httpServer.listen(PORT, () => {
  httpLog(`Server running on port ${PORT}`);
  httpLog(`Forwarding requests to local API at http://${LOCAL_API_HOST}:${LOCAL_API_PORT}`);
});

//WEBSOCKET ----------------------------------------------------------------
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

  // Handle messages from clients
  ws.on("message", (message) => {
    //websocketLog(`Message from client: ${message}`);

    // Parse the incoming message to add req_id
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      console.error(`${WEBSOCKET_LOG} Failed to parse incoming message:`, error);
      return;
    }

    // Increment globalID to generate a unique req_id for each message
    globalID++;

    // Assign the req_id to the message
    parsedMessage.req_id = globalID;

    // Forward the message to the relay server
    if (xplaneSocket.readyState === WebSocket.OPEN) {
      websocketLog(`Forwarding message to X-Plane server: ${JSON.stringify(parsedMessage)}`);
      xplaneSocket.send(JSON.stringify(parsedMessage));
    } else {
      console.error(`${WEBSOCKET_LOG} Relay server is not connected`);
    }
  });

  // Handle client disconnections
  ws.on("close", () => {
    connectedClients.delete(ws);
    websocketLog(`Client disconnected (${connectedClients.size} total)`);
  });

  // Handle errors on the client connection
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

// Handle connection to the relay server
xplaneSocket.on("open", () => {
  websocketLog(`Connected to X-Plane WebSocket server`);
});

// Handle errors on the relay WebSocket connection
xplaneSocket.on("error", (error) => {
  console.error(`${WEBSOCKET_LOG} X-Plane WebSocket error: ${error}`);
});

// Handle relay WebSocket server disconnection
xplaneSocket.on("close", () => {
  websocketLog(`X-Plane WebSocket server disconnected`);
});

// Provide instructions for accessing the server
websocketLog(`To test, connect to ws://${SERVER_IP}:${SERVER_PORT} from a client on the same network.`);
