
/**
 * Init app
 */

global.Promise = require('bluebird');
const Joi = require('joi');
const logger = require('./common/logger');

Joi.shortString = () => Joi.string().max(256);
Joi.limit = () => Joi.number().integer().min(1).max(100).default(20);
Joi.offset = () => Joi.number().integer().min(0).default(0);
Joi.objectId = () => Joi.string().regex(/^[a-f0-9]{24}$/);

logger.buildService(require('./services/NotificationService'), 'NotificationService');
logger.buildService(require('./services/ScoringService'), 'ScoringService');
logger.buildService(require('./services/SecurityService'), 'SecurityService');
logger.buildService(require('./services/SubmissionQueueService'), 'SecurityService');
logger.buildService(require('./services/SubmissionService'), 'SubmissionService');
logger.buildService(require('./services/ForumService'), 'ForumService');
