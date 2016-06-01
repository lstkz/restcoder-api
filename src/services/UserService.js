"use strict";

const _ = require('underscore');
const Path = require('path');
const User = require('../models').User;
const Joi = require('joi');
const ImageService = require('./ImageService');
const UploadService = require('./UploadService');
const ForumService = require('./ForumService');

const PICTURE_SIZE = 128;

//Exports
module.exports = {
  updateUserInfo,
  updatePicture,
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
