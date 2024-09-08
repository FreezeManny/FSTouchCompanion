// src/routes/custom-event/+server.js
import { produce } from "sveltekit-sse";
import ExtPlaneJs from "extplanejs";
import { delay } from "$lib/utils";
// Function to deep compare two objects (to detect changes)
function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

const ExtPlane = new ExtPlaneJs({
  host: "127.0.0.1",
  port: 51000,
  broadcast: true,
});

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

// Update the data object when ExtPlane sends data
ExtPlane.on("loaded", () => {
  ExtPlane.client.interval(0.01);

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
  });
});

export function POST() {
  let previousData = JSON.parse(JSON.stringify(data)); // Clone the initial data to track changes

  return produce(async function start({ emit }) {
    while (true) {
      // Compare the current data with the previous one
      if (!deepEqual(data, previousData)) {
        // If data has changed, emit the new state
        const { error } = emit("data", JSON.stringify(data));
        if (error) {
          return;
        }
        // Update the previous data to the current state
        previousData = JSON.parse(JSON.stringify(data));
      }
      // Use setImmediate to yield control to the event loop
      await new Promise((resolve) => setImmediate(resolve));
    }
  });
}


// Handle PUT requests to update the radios
export async function PUT({ request }) {
  try {
    const requestData = await request.json();

    if (requestData.hasOwnProperty("command")) {
      switch (requestData.command) {
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
    if (requestData.hasOwnProperty("dataRef")) {
      switch (requestData.dataRef.dataRefPrefix) {
        case "com1-stby":
          ExtPlane.client.set(radioConfig.com1.dataRef.standby, requestData.dataRef.value);
          break;
        case "com2-stby":
          ExtPlane.client.set(radioConfig.com2.dataRef.standby, requestData.dataRef.value);
          break;
        default:
          break;
      }
    }

    return new Response(null, { status: 200 }); // No body, just status code
  } catch (error) {
    console.error("Error fetching data:", error);
    return new Response(null, { status: 500 }); // No body, just status code
  }
}



async function commandTrigger(command) {
  ExtPlane.client.begin(command);
  await delay(50);
  ExtPlane.client.end(command);
}
