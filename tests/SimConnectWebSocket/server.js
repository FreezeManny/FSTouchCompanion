var ExtPlaneJs = require("extplanejs");


function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
} 


let radioData = {
  com1_act: {
    data_ref: "sim/cockpit2/radios/actuators/com1_frequency_hz_833",
    value: ""
  },
  com1_stby: {
    data_ref: "sim/cockpit2/radios/actuators/com1_standby_frequency_hz_833",
    value: ""
  },
  com2_act: {
    data_ref: "sim/cockpit2/radios/actuators/com2_frequency_hz_833",
    value: ""
  },
  com2_stby: {
    data_ref: "sim/cockpit2/radios/actuators/com2_standby_frequency_hz_833",
    value: ""
  },
}


let commands = {
  com1_switch: {
    command: "sim/GPS/g430n1_com_ff"
  },
  com2_switch: {
    command: "sim/GPS/g430n2_com_ff"
  }
}


var ExtPlane = new ExtPlaneJs({
  host: "127.0.0.1",
  port: 51000,
  broadcast: true,
});

ExtPlane.on("loaded", function () {
  this.client.interval(0.01);

  //Subscribing to datarefs
  for(let key in radioData){
    this.client.subscribe(radioData[key].data_ref);
  }

  // Handle all data-ref changes
  this.on("data-ref", function (data_ref, value) {
    console.log(data_ref + " - " + value);
    //Subscribing to all Outputs
    for(let key in radioData){
      obj = radioData[key];
      if (obj.data_ref == data_ref) {
        obj.value = value.toString();
      }
    
    }
    sendMessageToClient(JSON.stringify(radioData));
  });

  
});

async function commandTrigger(command) {
  console.log("Command: " + command);
  ExtPlane.client.begin(command);
  //await delay(100);
  ExtPlane.client.end(command);
}


// Importing required modules
const WebSocket = require('ws');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 3000 });
console.log("WebsocketStarted")

let connectedClient = null;

// Event listener for when a client connects
wss.on('connection', function connection(ws) {
  console.log('A client connected');

  // Set the connected client
  connectedClient = ws;
  sendMessageToClient(JSON.stringify(radioData));

  // Event listener for messages received from the client
  ws.on('message', function incoming(message) {
    console.log('Received: ');
    obj = JSON.parse(message);

    console.log(obj);
    if (obj.hasOwnProperty("command")) {
      commandTrigger(obj.command);
    }
  });

  // Event listener for when the client closes the connection
  ws.on('close', function () {
    console.log('Client disconnected');
    connectedClient = null;
  });


});

// Function to send a message to the connected client
function sendMessageToClient(message) {
  if (connectedClient) {
    connectedClient.send(message);
  } else {
    console.log('No client connected to send message to');
  }
}

