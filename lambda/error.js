'use strict';

const uuidv4 = require('uuid/v4');

exports.newErrorResponse = (request, type, message) => {
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
};
