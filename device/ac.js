'use strict';

const http = require('http');
const EchonetLite = require('node-echonet-lite');

exports.id = 'airConditioner';

exports.handle = async (status) => {
  const el = new EchonetLite({ type: 'lan' });
  await init(el);
  const device = await discover(el);
  await setOperationStatus(el, device, status.toUpperCase() === 'ON' ? true : false);
  await close(el);
};

/**
 * Initialize an EchonetLite object.
 * @see {@link https://github.com/futomi/node-echonet-lite}
 * @param {EchonetLite}
 * @returns {Promise}
 */
function init(el) {
  return new Promise((resolve, reject) => {
    el.init((err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

exports.init = init;

/**
 * Discover a home air conditioner.
 * @param {EchonetLite} An initialized EchonetLite object.
 * @returns {Promise} A device object.
 */
function discover(el) {
  return new Promise((resolve, reject) => {
    el.startDiscovery((err, res) => {
      if (err) {
        reject(err);
      }

      const device = res.device;
      const eoj = device.eoj[0];
      if (eoj[0] === 0x01 && eoj[1] === 0x30) {
        el.stopDiscovery();
        resolve(device);
      }
    });
  });
}

exports.discover = discover;

/**
 * Set operation status (power on/off).
 * @param {EchonetLite}
 * @param {Device}
 * @param {Boolean}
 * @returns {Promise}
 */
function setOperationStatus(el, device, status) {
  const epc = 0x80; // Operation status
  const edt = { status: status };
  return new Promise((resolve, reject) => {
    el.setPropertyValue(device.address, device.eoj[0], epc, edt, (err, res) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

exports.setOperationStatus = setOperationStatus;

function setOperationModeSetting(el, device, mode, temperature) {
  const prop = [
    { 'epc': 0x80, 'edt': { 'status': true } },
    { 'epc': 0xb0, 'edt': { 'mode': mode } },
    { 'epc': 0xb3, 'edt': { 'temperature': temperature } }
  ];
  return new Promise((resolve, reject) => {
    el.send(device.address, device.eoj[0], 'SetC', prop, (err, res) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

exports.setOperationModeSetting = setOperationModeSetting;

function close(el) {
  return new Promise((resolve, reject) => {
    el.close(() => {
      resolve();
    });
  });
}

exports.close = close;

/**
 * Get sensor information.
 * @param {String} address
 * @return {Promise} a Map including the information.
 */
function getSensorInfo(address) {
  return new Promise((resolve, reject) => {
    http.get('http://' + address + '/aircon/get_sensor_info', (res) => {
      res.setEncoding('utf-8');
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const m = new Map();
        for (const e of data.split(',')) {
          const [k, v] = e.split('=');
          m.set(k, v);
        }
        resolve(m);
      });
    });
  });
}

exports.getSensorInfo = getSensorInfo;
