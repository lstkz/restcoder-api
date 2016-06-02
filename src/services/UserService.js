"use strict";

const _ = require('underscore');
const Path = require('path');
const User = require('../models').User;
const Joi = require('joi');
const ImageService = require('./ImageService');
const UploadService = require('./UploadService');
const ForumService = require('./ForumService');
const ValidationError = require('../common/errors').ValidationError;
const helper = require('../common/helper');
const NotificationService = require('./NotificationService');
const config = require('config');

const PICTURE_SIZE = 128;

//Exports
module.exports = {
  updateUserInfo,
  updatePicture,
  removePicture,
  getUserData,
  changeEmail,
  verifyNewEmail,
};

function* updateUserInfo(userId, values) {
  const user = yield User.findByIdOrError(userId);
  user.fullName = values.fullName || '';
  user.quote = values.quote || '';
  yield user.save();
}

updateUserInfo.schema = {
  userId: Joi.string().required(),
  values: Joi.object().keys({
    fullName: Joi.string().empty('').max(50),
    quote: Joi.string().empty('').max(255),
  })
};


function* updatePicture(userId, originalName, filePath) {
  const user = yield User.findByIdOrError(userId);
  yield ImageService.resizeImage({
    path: filePath,
    width: PICTURE_SIZE,
    height: PICTURE_SIZE
  });
  const extension = Path.extname(originalName);
  const picture = yield UploadService.uploadPhotoToS3(user.username, extension, filePath);
  yield ForumService.updateUser(user.forumUserId, {picture, uploadedpicture: picture});
}

updatePicture.schema = {
  userId: Joi.string().required(),
  originalName: Joi.string().required(),
  filePath: Joi.string().required(),
};

function* removePicture(userId) {
  const user = yield User.findByIdOrError(userId);
  yield ForumService.updateUser(user.forumUserId, {picture: ''});
}

removePicture.schema = {
  userId: Joi.string().required(),
};

function* changeEmail(userId, email) {
  const user = yield User.findByIdOrError(userId);
  if (user.email_lowered === email.toLowerCase()) {
    throw new ValidationError('Cannot change to same email address');
  }
  var existing = yield User.findOne({ email_lowered: email.toLowerCase() });
  if (existing) {
    throw new ValidationError('Email address is already registered');
  }
  user.changeEmail = email;
  user.changeEmailCode = helper.randomUniqueString();
  yield user.save();
  yield NotificationService.sendMail(email, 'CHANGE_EMAIL', {
    username: user.username,
    link: config.URLS.CHANGE_EMAIL.replace('{code}', user.changeEmailCode)
  })
}

changeEmail.schema = {
  userId: Joi.string().required(),
  email: Joi.string().email().required(),
};


function* getUserData(userId) {
  const user = yield User.findByIdOrError(userId);
  const forumUser = yield ForumService.getUserProfile(user.forumUserId);
  const ret = _.pick(user.toJSON(), 'id', 'username', 'email', 'fullName', 'quote', 'changeEmail');
  ret.icon ={
    text: forumUser['icon:text'],
    bgColor: forumUser['icon:bgColor'],
  };
  ret.picture = forumUser.picture;
  return ret;
}
getUserData.schema = {
  userId: Joi.string().required()
};


function* verifyNewEmail(changeEmailCode) {
  const user = yield User.findOne({changeEmailCode});
  if (!user) {
    throw new ValidationError('Invalid code or already used');
  }
  const email = user.changeEmail;
  const existing = yield User.findOne({email_lowered: email.toLowerCase()});
  if (existing) {
    throw new ValidationError(`Cannot change your email. Email address ${email} is already assigned to another user.`);
  }
  user.email = email;
  user.email_lowered = email.toLowerCase();
  user.changeEmail = null;
  user.changeEmailCode = null;
  yield user.save();
  return user;
}
verifyNewEmail.schema = {
  changeEmailCode: Joi.string().required()
};
