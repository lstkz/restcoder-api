
'use strict';

var mongoose = require('mongoose');
var _ = require('underscore');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = new Schema({
    _id: {type: String, required: true},
    userId: {type: ObjectId, required:true},
    createdAt: {type: Date, "default": Date.now}
});
