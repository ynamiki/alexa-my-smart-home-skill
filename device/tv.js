'use strict';

const irMagician = require('irmagician');
const log4js = require('log4js');

const logger = log4js.getLogger();

exports.id = 'tv';

exports.handle = (config, value) => {
  logger.info(exports.id + ', set: ' + value);
  irMagician.play('./tv-power.json');
}
