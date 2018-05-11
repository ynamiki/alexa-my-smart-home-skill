import json
import logging
import sys
import time

from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient

import air_conditioner
import tv

EXIT_FAILURE = 1

CONFIG_FILE_NAME = './config.json'

logger = logging.getLogger(__name__)

config = dict()
try:
    with open(CONFIG_FILE_NAME) as f:
        config = json.load(f)
except OSError as e:
    logger.critical('cannot open config: {}'.format(e))
    sys.exit(EXIT_FAILURE)
except json.JSONDecodeError as e:
    logger.critical('cannot load config: {}'.format(e))
    sys.exit(EXIT_FAILURE)

def callback(client, userdata, message):
    payload = dict()
    try:
        payload = json.loads(message.payload.decode())
    except json.JSONDecodeError as e:
        logger.error('cannot decode message: {}, {}'.format(message.payload, e))
        return
    logger.warn('new message: {}'.format(payload))
    
    for k, v in payload.items():
        if k == air_conditioner.ID:
            air_conditioner.handle(config['airConditionerAddress'], v)
        elif k == tv.ID:
            tv.handle(v)
        else:
            logger.error('invalid key: {}'.format(k))

def main():
    logging.basicConfig(level=config.get('loggingLevel', 'WARNING'))

    client = AWSIoTMQTTClient(config['clientId'])
    client.configureEndpoint(config['host'], config['port'])
    client.configureCredentials(config['caCert'], config['privateKey'], config['clientCert'])

    if not client.connect():
        logger.critical('cannot connect to endpoint: {}'.format(config['host']))
        sys.exit(EXIT_FAILURE)

    mqtt_topic_name = config['mqttTopicName']

    if not client.subscribe(mqtt_topic_name, 1, callback):
        logger.critical('cannot subscribe: {}'.format(mqtt_topic_name))
        sys.exit(EXIT_FAILURE)

    while True:
        time.sleep(1)

    if not client.unsubscribe(mqtt_topic_name):
        logger.critical('cannot unsubscribe: {}'.format(mqtt_topic_name))
        # FALLTHROUGH

    if not client.disconnect():
        logger.critical('cannot disconnect')
        sys.exit(EXIT_FAILURE)

if __name__ == '__main__':
    main()
