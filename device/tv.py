import json
import logging

import irmcli

ID = 'tv'
DATA_FILE_NAME = './tv-power.json'

logger = logging.getLogger(__name__)

def handle(value):
    logger.debug('tv: {}'.format(value))
    irmcli.playIR(DATA_FILE_NAME)
