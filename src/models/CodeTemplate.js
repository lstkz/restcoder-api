'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FileSchema = new Schema({
  path: { type: String, required: true },
  content: { type: String, required: true }
});

module.exports = new Schema({
  _id: { type: String, required: true },
  files: { type: [FileSchema], required: true }
});
