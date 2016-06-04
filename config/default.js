'use strict';

const Path = require('path');
const defer = require('config/defer').deferConfig;

const config = module.exports = {
  API_BASE_URL: 'http://localhost:3500',
  ADMIN_EMAIL: 'sirmims@gmail.com',
  WEB_SERVER_PORT: 3500,
  LOG_LEVEL: 'debug',
  MONGODB_URL: 'mongodb://127.0.0.1:27017/restcoder',
  AMQP_URL: 'amqp://jtmqnmyh:PcJcfWz4Q86qd39tayVh7u64ogjoCiAD@tiger.cloudamqp.com/jtmqnmyh',
//  AMQP_URL: 'amqp://guest:guest@localhost:5672',
  STORAGE_PATH: Path.join(__dirname, '../uploads'),
  SUBMISSION_MAX_SIZE: 5 * 1024 * 1024,
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
    VERIFY_EMAIL: cfg.URL_PREFIX + '/verify-email/{code}',
    CHANGE_EMAIL: cfg.URL_PREFIX + '/change-email/{code}',
    FORGOT_PASSWORD: cfg.URL_PREFIX + '/reset-password/{code}',
  })),
  'AWS_ACCESS_KEY': process.env.AWS_ACCESS_KEY,
  'AWS_SECRET_KEY': process.env.AWS_SECRET_KEY,
  'S3_BUCKET': 'restcoder-prod',
  'AWS_REGION': 'eu-west-1',
  REDIS_OPTS: {
    host: '127.0.0.1',
    port: 6379,
    enable_offline_queue: false
  },
  RATE_LIMIT: '5/minute',
  NODEBB_PROBLEMS_CID: 5,
  NODEBB_URL: 'http://localhost:4567',
  NODEBB_TOKEN: '7f5950f5-f2d0-44aa-8a16-133e77aa49c0',
  NODEBB_BOT_TOKEN: 'e0b1d0d3-1b21-41e3-bae8-caf4beff3356',
  NODEBB_MASTER_TOKEN: '48d298dd-c82b-4213-92ef-aa59eaf011cd',
  
  WORKERS: 2
};
