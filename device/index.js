'use strict';

const fs = require('fs');
const awsIot = require('aws-iot-device-sdk');
const log4js = require('log4js');
const ac = require('./ac');
const tv = require('./tv');

const mqttTopic = 'alexa-my-smart-home-skill';

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const logger = log4js.getLogger();
logger.level = config.loggingLevel ? config.loggingLevel : 'warn';

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
  logger.info('subscribe: ' + mqttTopic);
  device.subscribe(mqttTopic);
});

device.on('message', (topic, payload) => {
  const message = JSON.parse(payload.toString());

  logger.debug('message in ' + topic + ': ' + JSON.stringify(message));
  
  for (let key in message) {
    if (key === ac.id) {
      ac.handle(config, message[key]);
    } else if (key === tv.id) {
      tv.handle(config, message[key]);
    } else {
      logger.warn('ignore invalid key: ' + key);
    }
  }
});
