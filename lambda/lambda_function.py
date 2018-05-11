import datetime
import json
import logging
import os
import uuid

import boto3

AWS_IOT_REGION = 'ap-northeast-1'
MQTT_TOPIC_NAME = 'alexa-my-smart-home-skill'

logger = logging.getLogger(__name__)
logger.setLevel(os.environ.get('LOGGING_LEVEL', 'WARNING').upper())

def error_response(request, type, message):
    response = {
        'event': {
            'header': {
                'namespace': 'Alexa',
                'name': 'ErrorResponse',
                'messageId': str(uuid.uuid4()),
                'correlationToken': request['directive']['header']['correlationToken'],
                'payloadVersion': '3'
            },
            'endpoint': request['directive']['endpoint'],
            'payload': {
                'type': type,
                'message': message
            }
        }
    }
    logger.debug('error response: {}'.format(response))
    return response

def handle_discovery(request, context):
    logger.debug('discovery request')

    endpoints = dict()
    try:
        with open('endpoints.json') as f:
            endpoints = json.load(f)
    except OSError as e:
        message = 'could not load endpoints: {}'.format(e)
        logger.error(message)
        return error_response(request, 'INTERNAL_ERROR', message)
    except json.JSONDecodeError as e:
        message = 'could not decode endpoints: {}'.format(e)
        logger.error(message)
        return error_response(request, 'INTERNAL_ERROR', message)

    response = {
        'event': {
            'header': {
                'namespace': 'Alexa.Discovery',
                'name': 'Discover.Response',
                'payloadVersion': '3',
                'messageId': str(uuid.uuid4())
            },
            'payload': {
                'endpoints': endpoints
            }
        }
    }
    logger.debug('discovery response: {}'.format(response))
    return response

def handle_power_controller(request, context):
    logger.debug('power controller request')

    client = boto3.client('iot-data', AWS_IOT_REGION)

    power_state = 'ON' if request['directive']['header']['name'] == 'TurnOn' else 'OFF'
    payload = {
        request['directive']['endpoint']['endpointId']: power_state
    }
    logger.debug('publish: {}'.format(payload))
    client.publish(topic=MQTT_TOPIC_NAME, payload=json.dumps(payload).encode())

    response = {
        'context': {
            'properties': [
                {
                    'namespace': 'Alexa.PowerController',
                    'name': 'powerState',
                    'value': power_state,
                    'timeOfSample': datetime.datetime.utcnow().isoformat() + 'Z',
                    'uncertaintyInMilliseconds': 500
                }
            ]
        },
        'event': {
            'header': {
                'namespace': 'Alexa',
                'name': 'Response',
                'payloadVersion': '3',
                'messageId': str(uuid.uuid4()),
                'correlationToken': request['directive']['header']['correlationToken']
            },
            'endpoint': request['directive']['endpoint'],
            'payload': {}
        }
    }
    logger.debug('power controller response: {}'.format(response))
    return response

def lambda_handler(event, context):
    logger.debug('request: {}'.format(event))

    namespace = event['directive']['header']['namespace']
    if namespace == 'Alexa.Discovery':
        return handle_discovery(event, context)
    elif namespace == 'Alexa.PowerController':
        return handle_power_controller(event, context)
    else:
        message = 'unsupported namespace: {}'.format(namespace)
        logger.error(message)
        return error_response(event, 'INVALID_DIRECTIVE', message)
