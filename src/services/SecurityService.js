'use strict';


const config = require('config');
const Joi = require('joi');
const _ = require('underscore');
const crypto = require('mz/crypto');
const NotFoundError = require('../common/errors').NotFoundError;
const BadRequestError = require('../common/errors').BadRequestError;
const ValidationError = require('../common/errors').ValidationError;
const UnauthorizedError = require('../common/errors').UnauthorizedError;
const validate = require('../common/validator').validate;
const User = require('../models').User;
const BearerToken = require('../models').BearerToken;
const helper = require('../common/helper');
const NotificationService = require('./NotificationService');
const ForumService = require('./ForumService');

module.exports = {
  register,
  authenticate,
  createBearerToken,
  verifyEmail,
  changePassword,
  forgotPassword,
};

function* register(values) {
  var existing = yield User.findOne({ email_lowered: values.email.toLowerCase() });
  if (existing) {
    throw new ValidationError('Email address is already registered');
  }
  existing = yield User.findOne({ username_lowered: values.username.toLowerCase() });
  if (existing) {
    throw new ValidationError('Username is already registered');
  }
  var salt = yield crypto.randomBytes(config.SECURITY.SALT_LENGTH);
  salt = salt.toString('hex');
  var hash = yield crypto.pbkdf2(values.password, salt, config.SECURITY.ITERATIONS, config.SECURITY.PASSWORD_LENGTH);
  values.salt = salt.toString('hex');
  values.password = hash.toString('hex');
  values.email_lowered = values.email.toLowerCase();
  values.username_lowered = values.username.toLowerCase();
  values.emailVerificationCode = helper.randomUniqueString();
  values.isVerified = false;

  var user = new User(values);
  yield user.save();
  yield NotificationService.sendMail(values.email, 'VERIFY_EMAIL', {
    username: values.username,
    link: config.URLS.VERIFY_EMAIL.replace('{code}', values.emailVerificationCode)
  });
  return user;
}

register.schema = {
  values: Joi.object().keys({
    username: Joi.string().min(3).max(12).alphanum().required(),
    password: Joi.string().min(4).required(),
    email: Joi.string().email().required()
  }).required()
};



function* authenticate(username, password, errorMsg = 'Invalid username or password') {
  validate({ username, password }, {
    username: 'ShortString',
    password: 'ShortString'
  });
  var user = yield User.findOne({ username_lowered: username.toLowerCase() });
  if (!user) {
    throw new UnauthorizedError(errorMsg);
  }
  if (!user.isVerified) {
    throw new BadRequestError('Your account is not verified. Please check activation email.');
  }
  var hash = yield crypto.pbkdf2(password, user.salt, config.SECURITY.ITERATIONS, config.SECURITY.PASSWORD_LENGTH);
  hash = hash.toString('hex');
  if (hash !== user.password) {
    throw new UnauthorizedError(errorMsg);
  }
  return user;
}

function* changePassword(userId, password) {
  const user = yield User.findByIdOrError(userId);
  var hash = yield crypto.pbkdf2(password, user.salt, config.SECURITY.ITERATIONS, config.SECURITY.PASSWORD_LENGTH);
  user.password = hash.toString('hex');
  yield user.save();
}

changePassword.schema = {
  userId: Joi.string().required(),
  password: Joi.string().min(4).required(),
};

function* forgotPassword(email) {
  const user = yield User.findOne({email_lowered: email.toLowerCase()});
  if (!user) {
    throw new NotFoundError('User is not registered');
  }
  user.resetPasswordCode = helper.randomUniqueString();
  yield user.save();
  yield NotificationService.sendMail(email, 'FORGOT_PASSWORD', {
    username: user.username,
    link: config.URLS.FORGOT_PASSWORD.replace('{code}', user.resetPasswordCode)
  })
}

forgotPassword.schema = {
  email: Joi.string().email().required()
};


function* createBearerToken(userId) {
  validate({ userId }, { userId: 'ObjectId' });
  var token = helper.randomUniqueString();
  yield BearerToken.create({ userId, _id: token });
  return token;
}


function* verifyEmail(code) {
  var user = yield User.findOne({ emailVerificationCode: code });
  if (!user) {
    throw new BadRequestError('Invalid verification code.');
  }
  if (user.isVerified) {
    throw new BadRequestError('Your account is already verified. Please sign in.');
  }
  user.isVerified = true;
  user.forumUserId = yield ForumService.createForumUser(user.username, user.email);
  yield user.save();
  return user;
}
verifyEmail.schema = {
  code: Joi.string().required()
};
