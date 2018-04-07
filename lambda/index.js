'use strict';

const fs = require('fs');
const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const logger = require('./logger');

const mqttTopic = 'alexa-my-smart-home-skill';

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

aws.config.update({ region: 'ap-northeast-1' });

exports.handler = (event, context, callback) => {
  logger.debug('request: ' + JSON.stringify(event));

  const namespace = event.directive.header.namespace;
  if (namespace === 'Alexa.Discovery') {
    handleDiscovery(event, context, callback);
  } else if (namespace === 'Alexa.PowerController') {
    handlePowerController(event, context, callback);
  } else {
    callback(null, errorResponse(event,
      'INVALID_DIRECTIVE', 'unsupported namespace: ' + namespace));
  }
};

function handleDiscovery(request, context, callback) {
  logger.debug('discovery request');

  const endpoints = JSON.parse(fs.readFileSync('endpoints.json', 'utf8'));

  const response = {
    "event": {
      "header": {
        "namespace": "Alexa.Discovery",
        "name": "Discover.Response",
        "payloadVersion": "3",
        "messageId": uuidv4()
      },
      "payload": {
        "endpoints": endpoints
      }
    }
  };
  logger.debug('discovery response: ' + JSON.stringify(response));
  callback(null, response);
}

function handlePowerController(request, context, callback) {
  logger.debug('power controller request');

  const iotData = new aws.IotData({ endpoint: config.endpoint });

  const powerState = (request.directive.header.name === 'TurnOn') ? "ON" : "OFF";
  const payload = {
    [request.directive.endpoint.endpointId]: powerState
  };
  const params = {
    topic: mqttTopic,
    payload: JSON.stringify(payload)
  };
  logger.debug('publish: ' + JSON.stringify(params));
  iotData.publish(params, (err, data) => {
    if (err) {
      logger.error('publish error: ' + err.message);
      callback(err, null);
      return;
    }

    const response = {
      "context": {
        "properties": [
          {
            "namespace": "Alexa.PowerController",
            "name": "powerState",
            "value": powerState,
            "timeOfSample": (new Date()).toISOString(),
            "uncertaintyInMilliseconds": 500
          }
        ]
      },
      "event": {
        "header": {
          "namespace": "Alexa",
          "name": "Response",
          "payloadVersion": "3",
          "messageId": uuidv4(),
          "correlationToken": request.directive.header.correlationToken
        },
        "endpoint": request.directive.endpoint,
        "payload": {}
      }
    };
    logger.debug('power controller response: ' + JSON.stringify(response));
    callback(null, response);
  });
}

function errorResponse(request, type, message) {
  const response = {
    "event": {
      "header": {
        "namespace": "Alexa",
        "name": "ErrorResponse",
        "messageId": uuidv4(),
        "correlationToken": request.directive.header.correlationToken,
        "payloadVersion": "3"
      },
      "endpoint": request.directive.endpoint,
      "payload": {
        "type": type,
        "message": message
      }
    }
  };
  logger.debug('error response: ' + JSON.stringify(response));
  return response;
}
