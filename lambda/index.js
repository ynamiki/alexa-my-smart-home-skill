'use strict';

const uuidv4 = require('uuid/v4');
const logger = require('./logger');
const error = require('./error');
const ac = require('./ac');

exports.handler = (event, context, callback) => {
  logger.debug('request: ' + JSON.stringify(event));

  if (event.directive.header.namespace === 'Alexa.Discovery') {
    handleDiscovery(event, context, callback, [
      ac.endpoint
    ]);
    return;
  }

  switch (event.directive.endpoint.endpointId) {
    case ac.endpoint.endpointId:
      ac.handleRequest(event, context, callback);
      break;
    default:
      logger.error('unknown endpoint');
      callback(null, error.newErrorResponse(event, 'NO_SUCH_ENDPOINT', 'unknown endpoint'));
  }
};

function handleDiscovery(request, context, callback, endpoints) {
  logger.debug('discovery request');

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
