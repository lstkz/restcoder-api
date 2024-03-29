
"use strict";

const _ = require('underscore');
const Joi = require('joi');
const request = require('superagent-bluebird-promise');
const config = require('config');
const logger = require('../common/logger');
const jwt = require('jwt-simple');

// Exports
module.exports = {
  createForumUser,
  getUserProfile,
  updateUser,
};

function _createCookie(forumUserId) {
  const payload = { forumUserId };
  return `${config.AUTH_COOKIE.NAME}=${jwt.encode(payload, config.JWT_SECRET)}`;
}

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
  const {body} = yield request
    .get(config.NODEBB_URL + '/api/me')
    .set({ cookie: _createCookie(forumUserId) })
    .promise();
  return body;
}
getUserProfile.schema = {
  forumUserId: Joi.number().required()
};

function* updateUser(forumUserId, data) {
  const {body} = yield request
    .put(config.NODEBB_URL + '/api/me')
    .set({ cookie: _createCookie(forumUserId) })
    .send(data)
    .promise();
  return body;
}
