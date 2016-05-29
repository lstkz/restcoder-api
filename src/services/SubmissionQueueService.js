'use strict';

const amqp = require('amqplib');
const config = require('config');
const logger = require('../common/logger');
var connection;
var channel;

module.exports = {
  init,
  addToQueue
};


function* init() {
  connection = yield amqp.connect(config.AMQP_URL);
  channel = yield connection.createConfirmChannel();
  channel.assertQueue(config.SUBMISSION_QUEUE_NAME, { durable: true });
  process.once('SIGINT', function () {
    try {
      connection.close();
    } catch (ignore) {
    }
    process.exit();
  });
  connection.on('error', function (err) {
    connection = null;
    channel = null;
    logger.logFullError(err, 'AMPQ');
    setTimeout(init, 200);
  })
}

function* addToQueue(message) {
  const intervalId = setInterval(() => {
    if (!channel) {
      return;
    }
    clearInterval(intervalId);
    channel.sendToQueue(config.SUBMISSION_QUEUE_NAME, new Buffer(JSON.stringify(message)), {});
  }, 50);
}
