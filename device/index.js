'use strict';

const fs = require('fs');
// https://github.com/aws/aws-iot-device-sdk-js
const awsIot = require('aws-iot-device-sdk');
const ac = require('./ac.js');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

/**
 * @see {@link https://github.com/aws/aws-iot-device-sdk-js#api}
 */
const device = awsIot.device({
  host: config.host,
  clientId: config.clientId,
  certPath: config.clientCert,
  keyPath: config.privateKey,
  caPath: config.caCert
});

device.on('connect', () => {
  device.subscribe(config.topic);
});

device.on('message', (topic, payload) => {
  const message = JSON.parse(payload.toString());

  for (const key in message) {
    if (key === ac.id) {
      ac.handle(message[key]);
    } else {
      console.error('invalid key:', key);
    }
  }
});
