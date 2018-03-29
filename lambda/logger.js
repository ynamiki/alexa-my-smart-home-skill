'use strict';

const levels = {
  'DEBUG': 0,
  'INFO': 1,
  'WARN': 2,
  'ERROR': 3
};

const defaultThreshold = 'WARN';

let threshold= process.env.LOGGING_LEVEL;
if (typeof threshold === 'undefined') {
  threshold = defaultThreshold;
}
threshold = threshold.toUpperCase();

function isEnabled(level) {
  return (levels[level] >= levels[threshold]);
}

exports.debug = (msg) => {
  if (isEnabled('DEBUG')) {
    console.log(msg);
  }
};

exports.info = (msg) => {
  if (isEnabled('INFO')) {
    console.info(msg);
  }
};

exports.warn = (msg) => {
  if (isEnabled('WARN')) {
    console.warn(msg);
  }
};

exports.error = (msg) => {
  if (isEnabled('ERROR')) {
    console.error(msg);
  }
};
