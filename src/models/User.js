'use strict';

const _ = require('underscore');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Mixed = mongoose.Schema.Types.Mixed;
const NotFoundError = require('../common/errors').NotFoundError;

var StatsSchema = new Schema({
  score: { type: Number, 'default': 0 },
  solvedProblems: { type: Number, 'default': 0 },
  submissions: { type: Number, 'default': 0 },
  // map language to score
  languages: { type: Mixed, 'default': {} },
  // map technology to score
  technologies: { type: Mixed, 'default': {} }
});

var schema = new Schema({
  username: { type: String, required: true },
  username_lowered: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  email: { type: String, required: true },
  email_lowered: { type: String, required: true, unique: true },
  forumUserId: Number,
  country: String,
  stats: { type: StatsSchema, required: true, 'default': {} },
  emailVerificationCode: { type: String, index: true },

  changeEmail: {type: String},
  changeEmailCode: {type: String, index: true},

  resetPasswordCode: {type: String, index: true},

  fullName: String,
  quote: String,
  createdAt: {type: Date, default: Date.now},
  isVerified: Boolean
});


schema.index({ 'stats': 1 });


schema.methods.toJsonResponse = function () {
  return _.pick(this.toJSON(), 'id', 'username', 'email');
};


schema.statics.getByUsername = function* (username) {
  var item = yield this.findOne({username_lowered: username.toLowerCase()});
  if (!item) {
    throw new NotFoundError(`${username} not found`);
  }
  return item;
};


module.exports = schema;
