'use strict';

const amqp = require('amqplib');
const config = require('config');
const co = require('co');
const logger = require('../common/logger');
var connection;
var channel;

module.exports = {
  init,
  addToQueue
};


process.once('SIGINT', function () {
  try {
    connection.close();
  } catch (ignore) {
  }
  process.exit();
});

function* _checkConnection() {
  if (connection) {
    return;
  }
  connection = yield amqp.connect(config.AMQP_URL);
  channel = yield connection.createConfirmChannel();
  channel.assertQueue(config.SUBMISSION_QUEUE_NAME, { durable: true });
  connection.on('error', function (err) {
    connection = null;
    channel = null;
    logger.logFullError(err, 'AMPQ');
  })
}

function* init() {
  yield _checkConnection();

  setInterval(function () {
    co(_checkConnection).catch((e) => logger.logFullError(e, 'init AMPQ'))
  }, 500);
}

function* addToQueue(message) {
  return yield new Promise((resolve, reject) => {
    let timeoutId = setTimeout(() => reject(new Error('Queue timeout')), 5000);
    const intervalId = setInterval(() => {
      if (!channel) {
        return;
      }
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      channel.sendToQueue(config.SUBMISSION_QUEUE_NAME, new Buffer(JSON.stringify(message)), {});
      resolve();
    }, 50);
  });
}
