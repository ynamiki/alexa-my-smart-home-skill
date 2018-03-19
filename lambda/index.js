'use strict';

const fs = require('fs');
const aws = require('aws-sdk');
const uuidv4 = require('uuid/v4');

aws.config.update({ region: 'ap-northeast-1' });

exports.handler = (event, context, callback) => {
  const namespace = event.directive.header.namespace;
  const name = event.directive.header.name;

  if (namespace === 'Alexa.Discovery') {
    handleDiscovery(event, context, callback);
  } else if (namespace === 'Alexa.PowerController') {
    handlePowerController(event, context, callback);
  } else if (namespace === 'Alexa' && name === 'ReportState'){
    handleReportState(event, context, callback);
  } else {
    returnErrorResponse(event, context, callback);
  }
};

function handleDiscovery(request, context, callback) {
  debug('discovery request', request);

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

  debug('discovery response', response);
  callback(null, response);
}

function handlePowerController(request, context, callback) {
  debug('power controller request', request);

  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

  const value = (request.directive.header.name === 'TurnOn') ? 'ON' : 'OFF';
  const desiredState = {"state":{"desired":{"airConditioner":value}}};

  const iotData = new aws.IotData({ endpoint: config.endpoint });
  const params = {
    thingName: config.thingName,
    payload: JSON.stringify(desiredState)
  };
  iotData.updateThingShadow(params, (err, data) => {
    if (err) {
      return callback(err, null);
    }

    const payload = JSON.parse(data.payload);
    debug('payload', payload);
    const response = {
      "context": {
        "properties": [
          {
            "namespace": "Alexa.PowerController",
            "name": "powerState",
            "value": payload.state.desired.airConditioner,
            "timeOfSample": new Date().toISOString(),
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
        "endpoint": {
          "scope": {
            "type": "BearerToken",
            "token": request.directive.endpoint.scope.token
          },
          "endpointId": request.directive.endpoint.endpointId
        },
        "payload": {}
      }
    };
  
    debug('power controller response', response);
    callback(null, response);
  });
}

function handleReportState(request, context, callback) {
  debug('report state request', request);
  
  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  const iotData = new aws.IotData({ endpoint: config.endpoint });
  const params = {
    thingName: config.thingName
  };
  iotData.getThingShadow(params, (err, data) => {
    if (err) {
      return callback(err, null);
    }

    const payload = JSON.parse(data.payload);
    debug('payload', payload);
    const response = {
      "context": {  
        "properties": [  
           {
              "namespace": "Alexa.PowerController",
              "name": "powerState",
              "value": payload.state.reported.airConditioner,
              "timeOfSample": new Date().toISOString(),
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
        "payload": {
        }
     }
    };
    
    debug('report state response', response);
    callback(null, response);
  });
}

function returnErrorResponse(request, context, callback) {
  debug('request', request);
  
  const response = {
    "event": {
      "header": {
        "namespace": "Alexa",
        "name": "ErrorResponse",
        "messageId": uuidv4(),
        "correlationToken": request.directive.header.correlationToken,
        "payloadVersion": "3"
      },
      "endpoint":{
        "endpointId": request.directive.endpoint.endpointId
      },
      "payload": {
        "type": "INVALID_DIRECTIVE",
        "message": "invalid directive"
      }
    }
  };
  
  debug('error', response);
  callback(null, response);
}

function debug(msg, value) {
  console.log('DEBUG: ' + msg + ': ' + JSON.stringify(value, null, '  '));
}
