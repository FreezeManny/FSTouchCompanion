var ExtPlaneJs = require("extplanejs");

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Configuration for the radios and their respective data references
const radioConfig = {
  com1: {
    dataRef: {
      standby: "sim/cockpit2/radios/actuators/com1_standby_frequency_hz_833",
      active: "sim/cockpit2/radios/actuators/com1_frequency_hz_833",
    },
    command: {
      switch: "sim/GPS/g430n1_com_ff",
    },
  },

  com2: {
    dataRef: {
      standby: "sim/cockpit2/radios/actuators/com2_standby_frequency_hz_833",
      active: "sim/cockpit2/radios/actuators/com2_frequency_hz_833",
    },
    command: {
      switch: "sim/GPS/g430n2_com_ff",
    },
  },
};

// Automatically generate the data object based on the radioConfig
let data = Object.fromEntries(
  Object.keys(radioConfig).map((radio) => [radio, Object.fromEntries(Object.keys(radioConfig[radio].dataRef).map((key) => [key, 0]))])
);

const ExtPlane = new ExtPlaneJs({
  host: "127.0.0.1",
  port: 51000,
  broadcast: true,
});

// Update the data object when ExtPlane sends data
ExtPlane.on("loaded", () => {
  ExtPlane.client.interval(0.01);
  connected = true;

  // Subscribe to the data references
  Object.values(radioConfig).forEach((radio) => {
    Object.values(radio.dataRef).forEach((dataRef) => {
      ExtPlane.client.subscribe(dataRef);
    });
  });

  // Listen for data updates from ExtPlane
  ExtPlane.on("data-ref", (data_ref, value) => {
    for (let radio in radioConfig) {
      for (let key in radioConfig[radio].dataRef) {
        if (radioConfig[radio].dataRef[key] === data_ref) {
          // Update the corresponding value in the data object
          data[radio][key] = value;
        }
      }
    }
    sendMessageToClient(JSON.stringify(data));
  });
});

function handleRecieve(obj) {
  if (obj.hasOwnProperty("command")) {
    switch (obj.command) {
      case "switch-com1":
        commandTrigger(radioConfig.com1.command.switch);
        break;
      case "switch-com2":
        commandTrigger(radioConfig.com2.command.switch);
        break;
      default:
        break;
    }
  }
  if (obj.hasOwnProperty("dataRef")) {
    switch (obj.dataRef.dataRefPrefix) {
      case "com1-stby":
        ExtPlane.client.set(radioConfig.com1.dataRef.standby, obj.dataRef.value);
        break;
      case "com2-stby":
        ExtPlane.client.set(radioConfig.com2.dataRef.standby, obj.dataRef.value);
        break;
      default:
        break;
    }
  }
}

async function commandTrigger(command) {
  ExtPlane.client.begin(command);
  await delay(50);
  ExtPlane.client.end(command);
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Importing required modules
const WebSocket = require("ws");

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 3000 });
console.log("WebsocketStarted");

let connectedClient = null;

// Event listener for when a client connects
wss.on("connection", function connection(ws) {
  console.log("Client connected");

  // Set the connected client
  connectedClient = ws;
  sendMessageToClient(JSON.stringify(data));

  // Event listener for messages received from the client
  ws.on("message", function incoming(message) {
    obj = JSON.parse(message);
    handleRecieve(obj);
  });

  // Event listener for when the client closes the connection
  ws.on("close", function () {
    console.log("Client disconnected");
    connectedClient = null;
  });
});

// Function to send a message to the connected client
function sendMessageToClient(message) {
  if (connectedClient) {
    connectedClient.send(message);
  } else {
    console.log("No client connected to send message to");
  }
}
