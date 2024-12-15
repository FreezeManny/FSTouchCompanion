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
