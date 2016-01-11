"use strict";

var co = require("co");

/**
 * Escape special regex characters
 * @param {String} text the text to escape
 * @returns {String} the escaped string
 */
RegExp.escape = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
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


module.exports = {
    wrapExpress
};