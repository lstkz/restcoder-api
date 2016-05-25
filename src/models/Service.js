'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = new Schema({
  _id: { type: String, required: true },
  dockerImage: { type: String, required: true },
  description:  { type: String, required: true },
  version: { type: String, required: true },
  url: { type: String, required: true },
  port: { type: Number, required: true },
  envName: { type: String, required: true },
  limits: {
    memory: { type: String, required: true }
  },
  rank: {
    name: { type: String, required: true }
  },
  doneText: String
});
