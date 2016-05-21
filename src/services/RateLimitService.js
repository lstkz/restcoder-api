"use strict";

const config = require('config');
const redis = require('redis');
const rateLimiter = require('redis-rate-limiter');
const client = redis.createClient(config.REDIS_OPTS);
const limit = rateLimiter.create({
  redis: client,
  key: (userId) => userId,
  rate: config.RATE_LIMIT
});

// Exports
module.exports = {
  check
};


function* check(userId) {
  return yield (cb) => {
    limit(userId, (err, rate) => {
      if (err) {
        return cb(error);
      }
      if (rate.over) {
        return cb(new Error('Rate limit exceeded. Limit ' + config.RATE_LIMIT));
      }
      cb();
    });
  }
}
