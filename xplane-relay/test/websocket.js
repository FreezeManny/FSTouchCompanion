// Import WebSocket module
const WebSocket = require("ws");

// Configuration
const SERVER_PORT = 8080; // Port for the WebSocket server
const RELAY_URL = "ws://localhost:8086/api/v1"; // URL of the relay WebSocket server
const SERVER_IP = "10.0.0.2";

// Set up the WebSocket server
const server = new WebSocket.Server({ port: SERVER_PORT });
console.log(`WebSocket server is running on ws://${SERVER_IP}:${SERVER_PORT}`);

// Connect to the relay WebSocket server
const relaySocket = new WebSocket(RELAY_URL);
console.log(`Connecting to X-Plane WebSocket at ${RELAY_URL}`);

// Track connected clients (stations)
const connectedClients = new Set();

// Handle new client connections to the WebSocket server
server.on("connection", (ws) => {
  console.log("New client connected");
  connectedClients.add(ws);

  // Handle messages from clients
  ws.on("message", (message) => {
    console.log(`Message from client: ${message}`);

    // Forward the message to the relay server
    if (relaySocket.readyState === WebSocket.OPEN) {
      relaySocket.send(message);
    } else {
      console.error("Relay server is not connected");
    }
  });

  // Handle client disconnections
  ws.on("close", () => {
    console.log("Client disconnected");
    connectedClients.delete(ws);
  });

  // Handle errors on the client connection
  ws.on("error", (error) => {
    console.error(`Client WebSocket error: ${error}`);
  });
});

// Handle incoming messages from the relay server
relaySocket.on("message", (message) => {
  console.log(`Message from X-Plane server: ${message}`);

  // Relay the message to all connected clients
  connectedClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

// Handle connection to the relay server
relaySocket.on("open", () => {
  console.log("Connected to X-Plane WebSocket server");
});

// Handle errors on the relay WebSocket connection
relaySocket.on("error", (error) => {
  console.error(`X-Plane WebSocket error: ${error}`);
});

// Handle relay WebSocket server disconnection
relaySocket.on("close", () => {
  console.log("X-Plane WebSocket server disconnected");
});

// Provide instructions for accessing the server
console.log(`To test, connect to ws://${SERVER_IP}:${SERVER_PORT} from a client on the same network.`);
