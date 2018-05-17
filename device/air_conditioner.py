import logging
import socket

ID = 'airConditioner'

# https://echonet.jp/spec_g/#standard-01

PORT = 3610

EHD = [0x10, 0x81]
TID = [0x00, 0x00]
EOJ_CONTROLLER_01 = [0x05, 0xff, 0x01]
EOJ_HOME_AIR_CONDITIONER_01 = [0x01, 0x30, 0x01]
ESV_SET_I = [0x60]
ESV_GET = [0x62]
EPC_OPERATION_STATUS = [0x80]
OPERATION_STATUS_ON = [0x30]
OPERATION_STATUS_OFF = [0x31]

logger = logging.getLogger(__name__)

def set_operation_status(host, status):
    """Set operation status.

    :param str host: A host name or an IP address of a target device.
    :param str status: Target status: 'ON' or 'OFF'.
    """
    logger.debug('set operation status: {}, {}'.format(host, status))

    edt = OPERATION_STATUS_ON if status.upper() == 'ON' else OPERATION_STATUS_OFF
    message = bytes(EHD
        + TID
        + EOJ_CONTROLLER_01
        + EOJ_HOME_AIR_CONDITIONER_01
        + ESV_SET_I
        + [0x01]
        + EPC_OPERATION_STATUS
        + [0x01]
        + edt)
    logger.debug('send message: {}'.format(message))

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.sendto(message, (host, PORT))

def get_operation_status(host):
    """Get operation status.

    :param str host: A host name or an IP address of a target device.
    :return: The operation status, 'ON' or 'OFF'.
    :rtype: str
    """
    logger.debug('get operation status: {}'.format(host))

    message = bytes(EHD
        + TID
        + EOJ_CONTROLLER_01
        + EOJ_HOME_AIR_CONDITIONER_01
        + ESV_GET
        + [0x01]
        + EPC_OPERATION_STATUS
        + [0x00])
    logger.debug('send message: {}'.format(message))

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.bind(('0.0.0.0', PORT))

        s.sendto(message, (host, PORT))

        message, _ = s.recvfrom(1024)
        logger.debug('receive message: {}'.format(message))

        return 'ON' if message[14] == OPERATION_STATUS_ON else 'OFF'

def handle(host, value):
    logger.debug('air conditioner: {}, {}'.format(host, value))
    set_operation_status(host, value)
