'use strict';

const EchonetLite = require('node-echonet-lite');
const moment = require('moment');
const ac = require('./ac.js');

const MODE_AUTOMATIC = 1;
const MODE_COOLING = 2;
const MODE_HEATING = 3;
const MODE_DEHUMIDIFICATION = 4;

const THRESHOLD_COOLING = 28;
const THRESHOLD_HEATING = 20;
const THRESHOLD_DEHUMIDIFICATION = 70;
const TEMPERATURE_COOLING = 26;
const TEMPERATURE_HEATING = 22;

function log(message) {
  console.log(moment().format() + ' ' + message);
}

async function turnOn() {
  const el = new EchonetLite({ type: 'lan' });
  await ac.init(el);
  const device = await ac.discoverHomeAirConditioner(el);
  
  const info = await ac.getSensorInfo(device.address);
  log(JSON.stringify(info));
  const htemp = parseFloat(info.htemp);
  const hhum = parseInt(info.hhum);

  let mode = -1;
  let temperature = 0;
  if (htemp >= THRESHOLD_COOLING) {
    mode = MODE_COOLING;
    temperature = TEMPERATURE_COOLING;
  } else if (htemp <= THRESHOLD_HEATING) {
    mode = MODE_HEATING;
    temperature = TEMPERATURE_HEATING;
  } else if (hhum >= THRESHOLD_DEHUMIDIFICATION) {
    mode = MODE_DEHUMIDIFICATION;
  }
  if (mode != -1) {
    await ac.setOperationModeSetting(el, device, mode, temperature);
    log('turn on: ' + temperature);
  }

  await ac.close(el);
}

async function turnOff() {
  const el = new EchonetLite({ type: 'lan' });
  await ac.init(el);
  const device = await ac.discoverHomeAirConditioner(el);
  await ac.setOperationStatus(el, device, false);
  await ac.close(el);
  log('turn off');
}

if (process.argv[2] == 'on') {
  turnOn();
} else {
  turnOff();
}
