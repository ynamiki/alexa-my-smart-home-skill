'use strict';

const dgram = require('dgram');
const log4js = require('log4js');

const logger = log4js.getLogger();

exports.id = 'airConditioner';

exports.handle = (config, value) => {
  setOperationStatus(config.acAddress, value, () => {});
}

/*
 * Constatants defined by ECHONET Lite.
 * https://echonet.jp/spec_g/#standard-01
 */

const port = 3610;

const ehd = [ 0x10, 0x81 ];
const tid = [ 0x00, 0x00 ];
const eojController01 = [ 0x05, 0xff, 0x01];
const eojHomeAirConditioner01 = [ 0x01, 0x30, 0x01 ];
const esvSetI = 0x60;
const esvGet = 0x62;
const epcOperationStatus = 0x80;
const operationStatusOn = 0x30;
const operationStatusOff = 0x31;

/**
 * @callback setOperationStatusCallback
 */

/**
 * Set operation status to the specified value.
 * @param {string} address An IP address of the target
 * @param {string} status Operation status to be set. 'OFF' or 'ON' (case-insensitive).
 * @param {setOperationStatusCallback} callback 
 */
function setOperationStatus(address, status, callback) {
  logger.info('set: ' + status + ', ' + address);

  const socket = dgram.createSocket('udp4');

  const edt = (status.toUpperCase() === 'ON')
    ? operationStatusOn
    : operationStatusOff;
  const msg = Buffer.from(ehd.concat(tid,
    eojController01,
    eojHomeAirConditioner01,
    esvSetI,
    0x01,
    epcOperationStatus,
    0x01,
    edt));

  logger.debug('message to be sent: ' + msg.toString('hex'));

  socket.send(msg, port, address, (err) => {
    socket.close();
    callback();
  });
}

/**
 * @callback getOperationStatusCallback
 * @param {string} status The current operation status. 'OFF' or 'ON'.
 */

/**
 * Get the current operation status.
 * @param {string} address An IP address of the target
 * @param {getOperationStatusCallback} callback 
 */
function getOperationStatus(address, callback) {
  logger.debug('get, ' + address);

  const socket = dgram.createSocket('udp4');

  socket.on('message', (msg, rinfo) => {
    logger.debug('recieved: ' + msg.toString('hex'));
    socket.close();
    callback((msg[14] === operationStatusOn) ? 'ON' : 'OFF');
  });

  socket.bind(port);

  const msg = Buffer.from(ehd.concat(tid,
    eojController01,
    eojHomeAirConditioner01,
    esvGet,
    0x01,
    epcOperationStatus,
    0x00));

  logger.debug('message to be sent: ' + msg.toString('hex'));

  socket.send(msg, port, address);
}
