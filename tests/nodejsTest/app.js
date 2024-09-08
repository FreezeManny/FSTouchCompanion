var ExtPlaneJs = require("extplanejs");

var ExtPlane = new ExtPlaneJs({
  host: "127.0.0.1",
  port: 51000,
  broadcast: true,
});

ExtPlane.on("loaded", function () {
  this.client.interval(0.01);

  this.client.subscribe(
    "sim/cockpit2/radios/actuators/com1_standby_frequency_hz_833"
  );

  // Handle all data-ref changes
  this.on("data-ref", function (data_ref, value) {
    console.log(data_ref + " - " + value);
  });
});
