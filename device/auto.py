import json
import sys

import requests

import air_conditioner

def get_sensor_info(host):
    r = requests.get('http://' + host + '/aircon/get_sensor_info')
    info = dict()
    for item in r.text.split(','):
        k, v = item.split('=', 1)
        try:
            info[k] = float(v)
        except ValueError:
            info[k] = v
    return info

def thi(temp, hum):
    """Calculate temperature-humidity index.
    """
    return (0.81 * temp + 0.01 * hum * (0.99 * temp - 14.3) + 46.3)

def conditionalOn(host):
    info = get_sensor_info(host)
    hthi = thi(info['htemp'], info['hhum'])
    print('sensor: {}, thi: {}'.format(info, hthi))
    if (info['htemp'] < 20) or (hthi >= 80):
        print('turn on')
        air_conditioner.set_operation_status(host, 'ON')

def off(host):
    print('turn off')
    air_conditioner.set_operation_status(host, 'OFF')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print('usage: node auto.js [on|off]')
        sys.exit(1)

    config = json.load(open('config.json'))
    host = config['airConditionerAddress']
    if sys.argv[1] == 'on':
        conditionalOn(host)
    else:
        off(host)
