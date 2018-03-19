'use strict';

const fs = require('fs');
const awsIot = require('aws-iot-device-sdk');
const log4js = require('log4js');
const echonet = require('./echonet.js');

const logger = log4js.getLogger();
logger.level = 'debug';

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

/**
 * @see {@link https://github.com/aws/aws-iot-device-sdk-js#api}
 */
const thingShadow = awsIot.thingShadow({
  host: config.host,
  clientId: config.clientId,
  certPath: config.clientCert,
  keyPath: config.privateKey,
  caPath: config.caCert
});

thingShadow.on('connect', () => {
  thingShadow.register(config.thingName, {}, () => {
    update(thingShadow, config.thingName);
  });
});

thingShadow.on('delta', (thingName, stateObject) => {
  logger.debug('delta: ' + thingName + ', ' + JSON.stringify(stateObject));
  echonet.setOperationStatus(stateObject.state.airConditioner, () => {
    update(thingShadow, thingName);
  });
});

function update(thingShadow, thingName) {
  echonet.getOperationStatus((status) => {
    const stateObject = {"state":{"reported":{"airConditioner":status}}};
    logger.debug('update: ' + JSON.stringify(stateObject));
    thingShadow.update(thingName, stateObject);
  });
}
