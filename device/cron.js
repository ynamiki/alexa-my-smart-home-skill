'use strict';

const EchonetLite = require('node-echonet-lite');
const ac = require('./ac.js');

const MODE_AUTOMATIC = 1;
const MODE_COOLING = 2;
const MODE_HEATING = 3;

const TEMPERATURE_COOLING = 26;
const TEMPERATURE_HEATING = 22;

async function turnOn() {
  const el = new EchonetLite({ type: 'lan' });
  await ac.init(el);
  const device = await ac.discoverHomeAirConditioner(el);
  
  const info = await ac.getSensorInfo(device.address);
  console.log('info: ' + JSON.stringify(info));
  const htemp = parseFloat(info.htemp);

  let mode = -1;
  let temperature;
  if (htemp > TEMPERATURE_COOLING) {
    mode = MODE_COOLING;
    temperature = TEMPERATURE_COOLING;
  } else if (htemp < TEMPERATURE_HEATING) {
    mode = MODE_HEATING;
    temperature = TEMPERATURE_HEATING;
  }
  if (mode != -1) {
    await ac.setOperationModeSetting(el, device, mode, temperature);
    console.log('turn on: ' + temperature);
  }

  await ac.close(el);
}

async function turnOff() {
  const el = new EchonetLite({ type: 'lan' });
  await ac.init(el);
  const device = await ac.discoverHomeAirConditioner(el);
  await ac.setOperationStatus(el, device, false);
  await ac.close(el);
  console.log('turn off');
}

if (process.argv[2] == 'on') {
  turnOn();
} else {
  turnOff();
}
