'use strict';

const EchonetLite = require('node-echonet-lite');
const ac = require('./ac.js');

async function getInfo() {
    const el = new EchonetLite({ type: 'lan' });
    await ac.init(el);
    const device = await ac.discoverHomeAirConditioner(el);

    const info = {};
    const sensorInfo = await ac.getSensorInfo(device.address);
    info['sensor'] = sensorInfo;

    const controlInfo = await ac.getControlInfo(device.address);
    info['control'] = controlInfo;

    await ac.close(el);

    return info;
}

async function log() {
    const info = await getInfo();
    const data = [
        info.sensor.otemp,
        info.sensor.htemp,
        info.sensor.hhum,
        info.control.pow,
        info.control.mode,
        info.control.stemp,
        info.control.shum
    ];
    
    const date = new Date();
    console.log(date.toISOString() + ' ' + data.join(','));
}

log();
