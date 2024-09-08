import { json } from '@sveltejs/kit';
import ExtPlaneJs from 'extplanejs';

const ExtPlane = new ExtPlaneJs({
  host: '127.0.0.1',
  port: 51000,
  broadcast: true,
});

ExtPlane.on('loaded', function () {
  this.client.interval(0.01);
  this.client.subscribe('sim/cockpit2/radios/actuators/com1_standby_frequency_hz_833');

  this.on('data-ref', function (data_ref, value) {
    console.log(data_ref + ' - ' + value);
  });
});

export async function GET() {
  return json({ status: 'ExtPlane initialized' });
}
