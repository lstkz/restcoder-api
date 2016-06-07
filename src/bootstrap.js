
/**
 * Init app
 */

global.Promise = require('bluebird');

const AWS = require('aws-sdk-promise');
const config = require('config');
AWS.config.update({
  s3: '2006-03-01',
  accessKeyId: config.AWS_ACCESS_KEY,
  secretAccessKey: config.AWS_SECRET_KEY,
  region: config.AWS_REGION
});

const Joi = require('joi');
const logger = require('./common/logger');

Joi.shortString = () => Joi.string().max(256);
Joi.limit = () => Joi.number().integer().min(1).max(100).default(20);
Joi.offset = () => Joi.number().integer().min(0).default(0);
Joi.objectId = () => Joi.string().regex(/^[a-f0-9]{24}$/);

logger.buildService(require('./services/NotificationService'), 'NotificationService');
logger.buildService(require('./services/ScoringService'), 'ScoringService');
logger.buildService(require('./services/SecurityService'), 'SecurityService');
logger.buildService(require('./services/SubmissionQueueService'), 'SubmissionQueueService');
logger.buildService(require('./services/SubmissionService'), 'SubmissionService');
logger.buildService(require('./services/ForumService'), 'ForumService');
logger.buildService(require('./services/ImageService'), 'ImageService');
logger.buildService(require('./services/UserService'), 'UserService');
logger.buildService(require('./services/MiscService'), 'MiscService');
