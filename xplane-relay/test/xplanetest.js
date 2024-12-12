const WebSocket = require('ws');

// Connect to the WebSocket server running on localhost at port 8080
const ws = new WebSocket('ws://localhost:8086/api/v1');

// Event listener for when the connection is established
ws.on('open', () => {
  console.log('Connected to the WebSocket server');
  // Send a message to the server
  ws.send('Hello, Server!');
});

// Event listener for receiving messages from the server
ws.on('message', (data) => {
  console.log('Received message from server:', data);
});

// Event listener for errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Event listener for when the connection is closed
ws.on('close', () => {
  console.log('Disconnected from WebSocket server');
});
