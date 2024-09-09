var ExtPlaneJs = require("extplanejs");
const { delay } = require("./utils");
const fs = require("fs/promises");
const aircraftData = require("./aircraftData.json");

let radioConfig = null;
let data = null;

const aircraftRef = "sim/aircraft/view/acf_ui_name";
const fsTimeRef = "sim/time/total_running_time_sec";
const reconnectionTime = 2000; // 2 seconds timeout for reconnection attempts
const connectionTimeout = 5000; // 5 seconds timeout for connection attempts
let updateTimeout;
let fsConnected = false;
let aircraftFound = false;

let ExtPlane;
let extPlaneConnection;
let retryInterval = reconnectionTime; // Time in milliseconds to wait before retrying connection

async function getAircraftByName(value) {
  value = value.trim().replace(/\0/g, ""); // Remove null characters

  const foundAircraft = aircraftData.find((aircraft) => {
    if (Array.isArray(aircraft.name)) {
      return aircraft.name.some((name) => value === name.trim());
    }
    return value === aircraft.name.trim();
  });

  if (foundAircraft) {
    // Use default aircraft data to merge with the specific one
    const defaultAircraft = aircraftData.find((aircraft) => Array.isArray(aircraft.name) && aircraft.name.includes("default"));
    if (defaultAircraft) {
      // Merge the specific aircraft data with the default one (deep merge)
      return mergeDeep(defaultAircraft.data, foundAircraft.data);
    }

    return foundAircraft.data;
  } else {
    return null; // Return null if no match is found
  }
}

// Helper function for deep merging objects
function mergeDeep(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], mergeDeep(target[key], source[key]));
    }
  }
  // Combine the two objects
  return Object.assign({}, target, source);
}

async function changeAircraft(aircraftName) {
  console.log("Aircraft changed to:", aircraftName);

  // Example usage:
  const aircraftData = await getAircraftByName(aircraftName);

  if (aircraftData) {
    // Handle the found aircraft
    console.log("Aircraft found");

    // Unsubscribe from all dataRefs
    unsubscribeAllDataRefs();

    // Update radioConfig and data
    radioConfig = aircraftData;
    data = Object.fromEntries(
      Object.keys(radioConfig).map((radio) => [radio, Object.fromEntries(Object.keys(radioConfig[radio].dataRef || {}).map((key) => [key, 0]))])
    );

    // Subscribe to all dataRefs
    subscribeAllDataRefs();
    aircraftFound = true;
    sendMessageToClient(JSON.stringify({ aircraftFound: aircraftFound }));
  } else {
    console.log("Aircraft not found");
    aircraftFound = false;
    sendMessageToClient(JSON.stringify({ aircraftFound: aircraftFound }));
  }
}

function subscribeAllDataRefs() {
  Object.values(radioConfig).forEach((radio) => {
    Object.values(radio.dataRef || {}).forEach((dataRef) => {
      extPlaneConnection.client.subscribe(dataRef);
    });
  });
}

function unsubscribeAllDataRefs() {
  if (radioConfig) {
    Object.values(radioConfig).forEach((radio) => {
      Object.values(radio.dataRef || {}).forEach((dataRef) => {
        extPlaneConnection.client.unsubscribe(dataRef);
      });
    });
  }
}

function onVariableStale() {
  console.log(`Sim has not been running for ${reconnectionTime} milliseconds`);
  fsConnected = false;
  sendMessageToClient(JSON.stringify({ fsConnected: false }));
}

function updateSimRunTime(value) {
  simRunTime = value;
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
  updateTimeout = setTimeout(onVariableStale, reconnectionTime);

  if (!fsConnected) {
    fsConnected = true;
    sendMessageToClient(JSON.stringify({ fsConnected: true }));
    sendMessageToClient(JSON.stringify(data));
  }
}

function handleFlightSimRecieve(data_ref, value) {
  if (data) {
    for (let radio in radioConfig) {
      for (let key in radioConfig[radio].dataRef) {
        if (radioConfig[radio].dataRef[key] === data_ref) {
          //console.log("DataRef: " + data_ref + " Value: " + value);
          data[radio][key] = value;
          sendMessageToClient(JSON.stringify(data));
        }
      }
    }
  }
}

function connectExtPlane() {
  if (fsConnected) {
    console.log("Already connected to ExtPlane.");
    return; // Prevent multiple connection attempts if already connected
  }

   extPlaneConnection = new ExtPlaneJs({
    host: "127.0.0.1",
    port: 51000,
    broadcast: true,
  });

  let timeoutId;

  // Set a timeout for connection attempt
  timeoutId = setTimeout(() => {
    console.error("Failed to connect to ExtPlane: Timeout");
    fsConnected = false;
    sendMessageToClient(JSON.stringify({ fsConnected: false }));
    // Attempt reconnection after a delay
    setTimeout(connectExtPlane, retryInterval);
  }, connectionTimeout);

  extPlaneConnection.on("loaded", () => {
    clearTimeout(timeoutId); // Clear the timeout on successful connection
    console.log("ExtPlane connected");
    fsConnected = true;

    extPlaneConnection.client.interval(0.01);
    extPlaneConnection.client.subscribe(fsTimeRef);
    extPlaneConnection.client.subscribe(aircraftRef);

    extPlaneConnection.on("data-ref", (data_ref, value) => {
      if (data_ref === fsTimeRef) {
        updateSimRunTime(value);
      }
      if (data_ref === aircraftRef) {
        changeAircraft(value);
      }

      handleFlightSimRecieve(data_ref, value);
    });
  });

  extPlaneConnection.on("error", (err) => {
    console.error("ExtPlane error:", err);
    fsConnected = false;
    sendMessageToClient(JSON.stringify({ fsConnected: false }));
    // Attempt reconnection after a delay
    setTimeout(connectExtPlane, retryInterval);
  });
}

// Initial connection attempt
connectExtPlane();

function handleWebsocketRecieve(obj) {
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
  extPlaneConnection.client.begin(command);
  await delay(20);
  extPlaneConnection.client.end(command);
}

// ------------------ Websocket Server ------------------
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3000 });
console.log("WebsocketStarted");

let connectedClient = null;

wss.on("connection", function connection(ws, req) {
  const clientIP = ws._socket.remoteAddress;
  console.log(`Client connected from IP: ${clientIP}`);
  connectedClient = ws;

  sendMessageToClient(JSON.stringify({ fsConnected: fsConnected }));
  sendMessageToClient(JSON.stringify({ aircraftFound: aircraftFound }));
  if (fsConnected) {
    sendMessageToClient(JSON.stringify(data));
  }

  ws.on("message", function incoming(message) {
    const obj = JSON.parse(message);
    console.log(`Received message from IP: ${clientIP}:`, obj);
    handleWebsocketRecieve(obj);
  });

  ws.on("close", function () {
    console.log(`Client from IP: ${clientIP} disconnected`);
    connectedClient = null;
  });
});

function sendMessageToClient(message) {
  if (connectedClient) {
    connectedClient.send(message);
  } else {
    //console.log("No client connected to send message to");
  }
}
