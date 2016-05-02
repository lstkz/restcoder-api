'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var Mixed = Schema.Types.Mixed;

module.exports = new Schema({
  problemId: { type: Number, required: true, ref: 'Problems' },
  userId: { type: ObjectId, required: true, ref: 'User' },
  url: { type: String, required: true },
  notifyKey: { type: String, required: true, unique: true, index: true },
  usedServices: { type: [String], 'default': [] },
  language: { type: String, required: true },
  createdAt: { type: Date, required: true, 'default': Date.now },

    // test results
  testedAt: { type: Date, required: false },
  result: { type: String, 'enum': ['PENDING', 'FAIL', 'PASS', 'ERROR'], 'default': 'PENDING' },
  errorMessage: String,
  testLogUrl: String,
  unitTestResult: Mixed
});
