'use strict';

const amqp = require('amqplib');
const config = require('config');
var connection;


module.exports = {
  init,
  addToQueue
};


function* init() {
  connection = yield amqp.connect(config.AMQP_URL);
  process.once('SIGINT', function () {
    try {
      connection.close();
    } catch (ignore) {
    }
    process.exit();
  });
}

function* addToQueue(message) {
  var channel = yield connection.createConfirmChannel();
  channel.assertQueue(config.SUBMISSION_QUEUE_NAME, { durable: true });
  channel.sendToQueue(config.SUBMISSION_QUEUE_NAME, new Buffer(JSON.stringify(message)), {});
}
