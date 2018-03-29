'use strict';

const fs = require('fs');
const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');
const logger = require('./logger');
const error = require('./error');

const endpointId = 'airConditioner';

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

aws.config.update({ region: 'ap-northeast-1' });

exports.endpoint = {
  "endpointId": endpointId,
  "friendlyName": "エアコン",
  "description": "Daikin F63TTCXP-W",
  "manufacturerName": "Daikin Industries, Ltd.",
  "displayCategories": [
    "SWITCH"
  ],
  "capabilities": [
    {
      "type": "AlexaInterface",
      "interface": "Alexa",
      "version": "3"
    },
    {
      "type": "AlexaInterface",
      "interface": "Alexa.PowerController",
      "version": "3",
      "properties": {
        "supported": [
          {
            "name": "powerState"
          }
        ],
        "proactivelyReported": false,
        "retrievable": true
      }
    }
  ]
};

exports.handleRequest = (request, context, callback) => {
  const namespace = request.directive.header.namespace;
  const name = request.directive.header.name;

  if (namespace === 'Alexa.PowerController') {
    handlePowerController(request, context, callback);
  } else if (namespace === 'Alexa' && name === 'ReportState') {
    handleReportState(request, context, callback);
  } else {
    logger.error('cannot handle request: ' + JSON.stringify(request));
    callback(null, error.newErrorResponse(request, 'INVALID_DIRECTIVE', 'invalid directive'));
  }
};

function handlePowerController(request, context, callback) {
  logger.debug('ac power controller request');

  const iotData = new aws.IotData({ endpoint: config.endpoint });

  const desiredState = {
    "state": {
      "desired": {
        [endpointId]: (request.directive.header.name === 'TurnOn') ? 'ON' : 'OFF'
      }
    }
  };
  const params = {
    thingName: config.thingName,
    payload: JSON.stringify(desiredState)
  };

  logger.debug('update ' + params.thingName + ': ' + params.payload);
  iotData.updateThingShadow(params, (err, data) => {
    if (err) {
      logger.error('cannot update thing shadow: ' + err.message);
      callback(null, error.newErrorResponse(request, 'INTERNAL_ERROR', err.message));
      return;
    }

    logger.debug('response from thing shadow: ' + data.payload);
    const payload = JSON.parse(data.payload);
    const response = {
      "context": {
        "properties": [
          {
            "namespace": "Alexa.PowerController",
            "name": "powerState",
            "value": payload.state.desired[endpointId],
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

    logger.debug('ac power controller response: ' + JSON.stringify(response));
    callback(null, response);
  });
}

function handleReportState(request, context, callback) {
  logger.debug('ac report state request');
  
  const iotData = new aws.IotData({ endpoint: config.endpoint });

  const params = {
    thingName: config.thingName
  };

  iotData.getThingShadow(params, (err, data) => {
    if (err) {
      logger.error('cannot get thing shadow: ' + err.message);
      callback(null, error.newErrorResponse(request, 'INTERNAL_ERROR', err.message));
      return;
    }

    const payload = JSON.parse(data.payload);
    logger.debug('response from thing shadow: ' + JSON.stringify(payload));

    const response = {
      "context": {  
        "properties": [  
           {
              "namespace": "Alexa.PowerController",
              "name": "powerState",
              "value": payload.state.reported[endpointId],
              "timeOfSample": (new Date()).toISOString(),
              "uncertaintyInMilliseconds": 500
            }
        ]
     },
     "event": {  
        "header": {  
           "messageId": uuidv4(),
           "correlationToken": request.directive.header.correlationToken,
           "namespace": "Alexa",
           "name": "StateReport",
           "payloadVersion": "3"
        },
        "endpoint": {  
           "endpointId": request.directive.endpoint.endpointId,
           "cookie": {}
        },
        "payload": {}
     }
    };
    
    logger.debug('ac report state response: ' + JSON.stringify(response));
    callback(null, response);
  });
}
