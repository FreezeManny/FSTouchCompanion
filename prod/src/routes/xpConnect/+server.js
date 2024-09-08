// src/routes/custom-event/+server.js
import { produce } from 'sveltekit-sse';
import ExtPlaneJs from "extplanejs";

// Function to deep compare two objects (to detect changes)
function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function POST() {
  let previousData = JSON.parse(JSON.stringify(data)); // Clone the initial data to track changes

  return produce(async function start({ emit }) {
    while (true) {
      // Compare the current data with the previous one
      if (!deepEqual(data, previousData)) {
        // If data has changed, emit the new state
        const { error } = emit('data', JSON.stringify(data));
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

const ExtPlane = new ExtPlaneJs({
  host: "127.0.0.1",
  port: 51000,
  broadcast: true,
});

// Configuration for the radios and their respective data references
const radioConfig = {
  com1: {
    standby: "sim/cockpit2/radios/actuators/com1_standby_frequency_hz_833",
    active: "sim/cockpit2/radios/actuators/com1_frequency_hz_833",
  },
  
  com2: {
    standby: "sim/cockpit2/radios/actuators/com2_standby_frequency_hz_833",
    active: "sim/cockpit2/radios/actuators/com2_frequency_hz_833",
  },
};

// Automatically generate the data object based on the radioConfig
let data = Object.fromEntries(
  Object.keys(radioConfig).map((radio) =>
    [radio, Object.fromEntries(Object.keys(radioConfig[radio]).map((key) => [key, 0]))]
  )
);

// Update the data object when ExtPlane sends data
ExtPlane.on("loaded", () => {
  ExtPlane.client.interval(0.01);

  // Subscribe to the data references
  Object.values(radioConfig).forEach((radio) => {
    Object.values(radio).forEach((dataRef) => {
      ExtPlane.client.subscribe(dataRef);
    });
  });

  // Listen for data updates from ExtPlane
  ExtPlane.on("data-ref", (data_ref, value) => {
    // Find the radio and key that match the data_ref
    for (let radio in radioConfig) {
      for (let key in radioConfig[radio]) {
        if (radioConfig[radio][key] === data_ref) {
          // Update the corresponding value in the data object
          data[radio][key] = value;
        }
      }
    }
  });
});
