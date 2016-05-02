'use strict';

const Path = require('path');
const defer = require('config/defer').deferConfig;

module.exports = {
  WEB_SERVER_PORT: 3500,
  LOG_LEVEL: 'debug',
  MONGODB_URL: 'mongodb://127.0.0.1:27017/restcoder',
  AMQP_URL: 'amqp://guest:guest@localhost:5672',
  STORAGE_PATH: Path.join(__dirname, '../uploads'),
  SUBMISSION_MAX_SIZE: 5 * 1024 * 1024,
  SUBMISSION_DOWNLOAD_URL: 'http://192.168.0.21:3500/uploads/',
  SECURITY: {
    SALT_LENGTH: 64,
    ITERATIONS: 4096,
    PASSWORD_LENGTH: 64
  },
  UNIQUE_STRING_LENGTH: 20,
  JWT_SECRET: 'd9d902nfdbncbvaladm1f',
  SESSION_SECRET: 'dkvnvndkjdituworgbcs',
  SUBMISSION_QUEUE_NAME: 'submissions',
  AUTH_COOKIE: {
    NAME: 'auth',
    EXPIRATION: '14d'
  },
  SMTP_HOST: 'smtp.mailgun.org',
  SMTP_PORT: 587,
  SMTP_USERNAME: 'postmaster@sandboxa999b617e8334670921935b26a97a680.mailgun.org',
  SMTP_PASSWORD: '9d775f721ab7c0031e957720074ef833',
  EMAIL_SENDER_ADDRESS: 'noreply@restcoder.com',
  URL_PREFIX: 'http://localhost:3000',
  URLS: defer((cfg) => ({
    VERIFY_EMAIL: cfg.URL_PREFIX + '/verify-email/{code}'
  }))
};
