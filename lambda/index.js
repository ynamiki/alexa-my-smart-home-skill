'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');

AWS.config.update({ region: 'ap-northeast-1' });

exports.handler = async (event) => {
  // console.log('request:', JSON.stringify(event));

  let response;
  const namespace = event.directive.header.namespace;
  if (namespace === 'Alexa.Discovery') {
    response = handleDiscovery(event);
  } else if (namespace === 'Alexa.PowerController') {
    response = await handlePowerController(event);
  } else {
    response = errorResponse(event, 'INVALID_DIRECTIVE', 'unsupported namespace: ' + namespace);
  }

  // console.log('response:', JSON.stringify(response));
  return response;
};

function handleDiscovery(request) {
  const endpoints = JSON.parse(fs.readFileSync('endpoints.json', 'utf8'));
  return {
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
}

function handlePowerController(request) {
  const iotData = new AWS.IotData({ endpoint: process.env.ENDPOINT });

  const powerState = (request.directive.header.name === 'TurnOn') ? 'ON' : 'OFF';
  const payload = {
    [request.directive.endpoint.endpointId]: powerState
  };
  const params = {
    topic: process.env.TOPIC,
    payload: JSON.stringify(payload)
  };
  return new Promise((resolve, reject) => {
    iotData.publish(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({
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
      });
    });
  });
}

function errorResponse(request, type, message) {
  return {
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
}
