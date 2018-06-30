'use strict';

const EchonetLite = require('node-echonet-lite');
const ac = require('./ac.js');

async function getSensorInfo() {
  const el = new EchonetLite({ type: 'lan' });
  await ac.init(el);
  const device = await ac.discover(el);
  await ac.close(el);

  const info = await ac.getSensorInfo(device.address);

  return info;
}

async function on(mode) {
  const el = new EchonetLite({ type: 'lan' });
  await ac.init(el);
  const device = await ac.discover(el);

  if (mode === 'cool') {
    await ac.setOperationModeSetting(el, device, 2, 25);
  } else if (mode === 'heat') {
    await ac.setOperationModeSetting(el, device, 3, 20);
  }

  await ac.close(el);
}

function off() {
  ac.handle('OFF').then();
}

if (process.argv[2] === 'auto') {
  getSensorInfo().then((value) => {
    const htemp = parseFloat(value.get('htemp'));
    // const hhum = parseFloat(value.hhum);
    const otemp = parseFloat(value.get('otemp'));

    if (htemp < 20) {
      on('heat');
    } else if (otemp > 25) {
      on('cool');
    }
  });
} else {
  off();
}
