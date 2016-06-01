"use strict";
const config = require('config');
const fs = require('fs');
const Joi = require('joi');
const AWS = require('aws-sdk-promise');
const helper = require('../common/helper');
const s3 = new AWS.S3();

//Exports
module.exports = {
  uploadPhotoToS3
};


function* uploadPhotoToS3(username, extension, filePath) {
  var stream = fs.createReadStream(filePath);
  var key = `avatars/${username}/${helper.randomUniqueString()}${extension}`;
  var params = {
    Bucket: config.S3_BUCKET,
    Key: key,
    Body: stream,
    ContentType: 'image/jpeg'
  };
  yield s3.putObject(params).promise();
  params = {
    Bucket: config.S3_BUCKET,
    Key: key
  };

  return s3.getSignedUrl('getObject', params).split('?')[0];
}

uploadPhotoToS3.schema = {
  username: Joi.string().required(),
  extension: Joi.string().required(),
  filePath: Joi.string().required(),
};
