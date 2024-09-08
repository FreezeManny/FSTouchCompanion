#!/usr/bin/env node



var pConf = JSON.parse(require('fs').readFileSync('../portConfig.json'));

const wsPort = pConf.socketServerWebSocket;
const httpServerPort = pConf.socketServerHTTP;

const sveltePort = pConf.svelte;


//Init Express Server
const express = require('express');
const app = express();


var WebSocketServer = require("websocket").server;
var http = require("http");

var connections = []; // Array to store all the connections

const reqFunc = {
  UPDATE: 0,
  GET_DATA: 1,
}

/*
var sendJSON = {
  "id": [1, 2],
  "function": reqFunc.UPDATE,
}
*/
var server = http.createServer(function (request, response) {
  console.log("Websocket: Received request for " + request.url);
  response.writeHead(404);
  response.end();
});

server.listen(wsPort, function () {
  console.log("Websocket: Server is listening on port " + wsPort);
});

wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on("request", function (request) {
  if (!originIsAllowed(request.origin)) {
 // Make sure we only accept requests from an allowed origin
 request.reject();
 console.log(
   new Date() + " Connection from origin " + request.origin + " rejected."
 );
 return;
  }

  //var connection = request.accept("arduino", request.origin);
  var connection = request.accept(null, request.origin);
  connections.push(connection); // Add the new connection to the array

  console.log(new Date() + " Connection accepted.");

  connection.on("message", function (message) {
 if (message.type === "utf8") {
   console.log("Received Message: " + message.utf8Data);
 } else if (message.type === "binary") {
   console.log(
     "Received Binary Message of " + message.binaryData.length + " bytes"
   );
 }
  });

  connection.on("close", function (reasonCode, description) {
 console.log(
   new Date() + " Peer " + connection.remoteAddress + " disconnected."
 );
 // Remove the closed connection from the array
 connections = connections.filter(function (conn) {
   return conn !== connection;
 });
  });

  var sendJSON = {
    "id": ["Hallo Client"],
    "function": 99,
  }
  var stringJSON = JSON.stringify(sendJSON);
    connection.sendUTF(stringJSON);
});


function sendData(json) {
  connections.forEach(function (connection) {
    console.log("Sending Message ", connection.remoteAddress);
    var stringJSON = JSON.stringify(json);
    connection.sendUTF(stringJSON); // Send the message to each connection
    //connection.sendUTF(json); // Send the message to each connection
  });
}


//Express Requests
app.use(express.json());
//app.use(cors());
const allowSvelte = 'http://localhost:' + sveltePort;
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowSvelte);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get("/", (req, res) => {
    console.log("Web Server: GET Request Successfull!");
    res.send("Web Server: Get Req Successfully initiated");
})
 
app.put("/put", (req, res) => {
    console.log("Web Server: PUT REQUEST SUCCESSFUL: ", req.body);
    sendData(req.body);
    res.send(`Web Server: Data Update Request Recieved`);
})
app.listen(httpServerPort, () => {
    console.log(`Web Server: Server established at ${httpServerPort}`);
})