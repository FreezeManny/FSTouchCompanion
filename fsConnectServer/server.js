var ExtPlaneJs = require("extplanejs");
const { delay } = require("./utils");
const fs = require('fs/promises');
const aircraftData = require('./aircraftData.json');

let radioConfig = null;
let data = null;

async function getAircraftByName(value) {
  value = value.trim().replace(/\0/g, ""); // Remove null characters

  const foundAircraft = aircraftData.find((aircraft) => value === aircraft.name.trim());
  if (foundAircraft) {
    return foundAircraft.data;
  } else {
    return null; // Return null if no match is found
  }
}

async function changeAircraft(aircraftName) {
  console.log("Aircraft changed to:", aircraftName);

  // Example usage:
  const aircraftData = await getAircraftByName(aircraftName);

  if (aircraftData) {
    // Handle the found aircraft
    console.log("Aircraft found:", aircraftData);

    // Unsubscribe from all dataRefs
    unsubscribeAllDataRefs();

    // Update radioConfig and data
    radioConfig = aircraftData;
    data = Object.fromEntries(
      Object.keys(radioConfig).map((radio) => [radio, Object.fromEntries(Object.keys(radioConfig[radio].dataRef).map((key) => [key, 0]))])
    );

    // Subscribe to all dataRefs
    subscribeAllDataRefs();
  } else {
    console.log("Aircraft not found");
  }
}

function subscribeAllDataRefs() {
  Object.values(radioConfig).forEach((radio) => {
    Object.values(radio.dataRef).forEach((dataRef) => {
      ExtPlane.client.subscribe(dataRef);
    });
  });
}

function unsubscribeAllDataRefs() {
  if (radioConfig) {
    Object.values(radioConfig).forEach((radio) => {
      Object.values(radio.dataRef).forEach((dataRef) => {
        ExtPlane.client.unsubscribe(dataRef);
      });
    });
  }
}

const aircraftRef = "sim/aircraft/view/acf_ui_name";
const fsTimeRef = "sim/time/total_running_time_sec";
const reconnectionTime = 2000;
let updateTimeout;
let fsConnected = false;

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

let ExtPlane;
let retryInterval = reconnectionTime; // Time in milliseconds to wait before retrying connection

function connectExtPlane() {
  ExtPlane = new ExtPlaneJs({
    host: "127.0.0.1",
    port: 51000,
    broadcast: true,
  });

  ExtPlane.on("loaded", () => {
    console.log("ExtPlane connected");
    ExtPlane.client.interval(0.01);
    fsConnected = true;

    ExtPlane.client.subscribe(fsTimeRef);
    ExtPlane.client.subscribe(aircraftRef);

    ExtPlane.on("data-ref", (data_ref, value) => {
      if (data_ref === fsTimeRef) {
        updateSimRunTime(value);
      }
      if (data_ref === aircraftRef) {
        changeAircraft(value);
      }

      if (data) {
        for (let radio in radioConfig) {
          for (let key in radioConfig[radio].dataRef) {
            if (radioConfig[radio].dataRef[key] === data_ref) {
              console.log("DataRef: " + data_ref + " Value: " + value);
              data[radio][key] = value;
              sendMessageToClient(JSON.stringify(data));
            }
          }
        }
      }
    });
  });

  ExtPlane.on("error", (err) => {
    console.error("ExtPlane error:", err);
    fsConnected = false;
    sendMessageToClient(JSON.stringify({ fsConnected: false }));
    setTimeout(connectExtPlane, retryInterval); // Retry connection after a delay
  });
}

function checkConnection() {
  if (!fsConnected) {
    console.log("Attempting to reconnect...");
    connectExtPlane();
  }
}

// Initial connection attempt
connectExtPlane();

// Periodically check if we need to reconnect
setInterval(checkConnection, 10000); // Check every 10 seconds

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
  await delay(20);
  ExtPlane.client.end(command);
}

// ------------------ Websocket Server ------------------
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3000 });
console.log("WebsocketStarted");

let connectedClient = null;

wss.on("connection", function connection(ws) {
  console.log("Client connected");
  connectedClient = ws;

  sendMessageToClient(JSON.stringify({ fsConnected: fsConnected }));
  if (fsConnected) {
    sendMessageToClient(JSON.stringify(data));
  }

  ws.on("message", function incoming(message) {
    obj = JSON.parse(message);
    handleRecieve(obj);
  });

  ws.on("close", function () {
    console.log("Client disconnected");
    connectedClient = null;
  });
});

function sendMessageToClient(message) {
  if (connectedClient) {
    connectedClient.send(message);
  } else {
    console.log("No client connected to send message to");
  }
}
