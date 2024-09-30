var ExtPlaneJs = require('extplanejs');

var ExtPlane = new ExtPlaneJs({
    host: "localhost",
    port: 51000,
    broadcast: true
});

ExtPlane.on('loaded', function(){

	ExtPlane.client.interval(0.33);

	// Subscribe to the airspeed
	ExtPlane.client.subscribe("sim/cockpit2/radios/actuators/com1_standby_frequency_hz_833");

	// Handle all data-ref changes
	ExtPlane.on('data-ref', function(data_ref, value){
		console.log(data_ref+' - '+value);
	});
});
