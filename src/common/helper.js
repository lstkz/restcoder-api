'use strict';

const co = require('co');
const _ = require('underscore');
const crypto = require('crypto');
const config = require('config');

/**
 * Escape special regex characters
 * @param {String} text the text to escape
 * @returns {String} the escaped string
 */
RegExp.escape = function (text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

/**
 * Wrap generator function to standard express function
 * @param {Function} fn the generator function
 * @returns {Function} the wrapped function
 */
function wrapExpress(fn) {
  return function (req, res, next) {
    co(fn(req, res, next)).catch(next);
  };
}
/**
 * Wrap all generators from object
 * @param obj the object (controller exports)
 * @returns {Object|Array} the wrapped object
 */
function autoWrapExpress(obj) {
  if (_.isArray(obj)) {
    return obj.map(autoWrapExpress);
  }
  if (_.isFunction(obj)) {
    if (obj.constructor.name === 'GeneratorFunction') {
      return wrapExpress(obj);
    }
    return obj;
  }
  _.each(obj, (value, key) => {
    obj[key] = autoWrapExpress(value);
  });
  return obj;
}

/**
 * Random a string
 * @param {Number} length the expected length
 * @returns {String} the string
 */
function randomString(length) {
  var chars = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789',
    randomBytes = crypto.randomBytes(length),
    result = new Array(length),
    cursor = 0,
    i;
  for (i = 0; i < length; i++) {
    cursor += randomBytes[i];
    result[i] = chars[cursor % chars.length];
  }
  return result.join('');
}

function randomUniqueString() {
  return randomString(config.UNIQUE_STRING_LENGTH);
}

module.exports = {
  wrapExpress,
  randomString,
  randomUniqueString,
  autoWrapExpress
};
