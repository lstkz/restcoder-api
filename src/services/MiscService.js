"use strict";

const Joi = require('joi');
const config = require('config');
const User = require('../models').User;
const NotificationService = require('./NotificationService');

//Exports
module.exports = {
  contact
};

function* contact(values) {
  let user;
  if (values.userId) {
    user = yield User.findByIdOrError(values.userId);
    values.email = user.email;
  } else {
    values.userId = 'anonymous';
  }
  yield NotificationService.sendMail(config.ADMIN_EMAIL, 'CONTACT', values);
}

contact.schema = {
  values: Joi.object().keys({
    userId: Joi.string(),
    email: Joi.string(),
    subject: Joi.string().required(),
    message: Joi.string().required(),
  }).required().or('userId', 'email'),
};
