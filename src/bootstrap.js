
/**
 * Init app
 */

global.Promise = require('bluebird');
const Joi = require('joi');
const logger = require('./common/logger');

Joi.shortString = () => Joi.string().max(256);

logger.buildService(require('./services/NotificationService'), 'NotificationService');
logger.buildService(require('./services/ScoringService'), 'ScoringService');
logger.buildService(require('./services/SecurityService'));
logger.buildService(require('./services/SubmissionQueueService'), 'SecurityService');
logger.buildService(require('./services/SubmissionService'), 'SubmissionService');
