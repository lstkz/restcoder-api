
"use strict";

const Joi = require('joi');
const request = require('superagent-bluebird-promise');
const config = require('config');
const logger = require('../common/logger');
const jwt = require('jwt-simple');

// Exports
module.exports = {
  createForumUser,
  getUserProfile,
};

function* createForumUser(username, email) {
  const {body} = yield request
    .post(config.NODEBB_URL + '/api/v1/users')
    .send({username, email})
    .set('authorization', `Bearer ${config.NODEBB_TOKEN}`)
    .promise();
  if (body.code !== 'ok') {
    logger.error('cannot create forum user', body);
    throw new Error('Cannot create forum user');
  }
  return body.payload.uid;
}
createForumUser.schema = {
  username: Joi.string().required(),
  email: Joi.string().email().required(),
};

function* getUserProfile(forumUserId) {
  const payload = { forumUserId };
  const cookie = `${config.AUTH_COOKIE.NAME}=${jwt.encode(payload, config.JWT_SECRET)}`;
  const {body} = yield request
    .get(config.NODEBB_URL + '/api/me')
    .set({ cookie })
    .promise();
  return body;
}

getUserProfile.schema = {
  forumUserId: Joi.number().required()
};
