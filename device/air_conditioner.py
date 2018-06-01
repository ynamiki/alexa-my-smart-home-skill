import collections
import logging
import socket
import struct

ID = 'airConditioner'

# https://echonet.jp/spec_g/#standard-01

PORT = 3610
BIND_ADDRESS = ('', PORT)
MULTICAST_ADDRESS = ('224.0.23.0', PORT)

BUFFER_SIZE = 1024

EHD = [0x10, 0x81]
TID = [0x00, 0x00]
EOJ_CONTROLLER_01 = [0x05, 0xff, 0x01]
EOJ_HOME_AIR_CONDITIONER_01 = [0x01, 0x30, 0x01]
EOJ_NODE_PROFILE = [0x0e, 0xf0, 0x01]
ESV_SET_I = [0x60]
ESV_GET = [0x62]
EPC_OPERATION_STATUS = [0x80]
EPC_SELF_NODE_INSTANCE_LIST_S = [0xd6]
OPERATION_STATUS_ON = [0x30]
OPERATION_STATUS_OFF = [0x31]

logger = logging.getLogger(__name__)

def opc(n):
    """Target property counter.
    This holds the number of properties to be written, read, or notified.
    """
    return [n]

def pdc(n):
    """Property data counter.
    This retains the number of bytes in ECHONET Property Value Data (EDT).
    """
    return [n]

def pdc_get():
    return pdc(0)

def get_host():
    message = bytes(EHD
        + TID
        + EOJ_CONTROLLER_01
        + EOJ_NODE_PROFILE
        + ESV_GET
        + opc(1)
        + EPC_SELF_NODE_INSTANCE_LIST_S
        + pdc_get())
    logger.debug('send message: {}'.format(message))

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        # s.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, socket.inet_aton('192.168.0.1'))
        s.bind(BIND_ADDRESS)

        s.sendto(message, MULTICAST_ADDRESS)

        # while True: # TODO Support multiple devices
        message, address = s.recvfrom(BUFFER_SIZE)
        logger.debug('receive message: {}, {}'.format(address, message))

    return address[0]

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
        + opc(1)
        + EPC_OPERATION_STATUS
        + pdc(1)
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
        + opc(1)
        + EPC_OPERATION_STATUS
        + pdc_get())
    logger.debug('send message: {}'.format(message))

    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.bind(BIND_ADDRESS)

        s.sendto(message, (host, PORT))

        message, _ = s.recvfrom(1024)
        logger.debug('receive message: {}'.format(message))

        return 'ON' if message[14] == OPERATION_STATUS_ON else 'OFF'

def handle(value):
    logger.debug('air conditioner: {}'.format(value))
    set_operation_status(get_host(), value)
