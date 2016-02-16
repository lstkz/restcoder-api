
'use strict';

const mongoose = require('mongoose');
const _ = require('underscore');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = new Schema({
    _id: {type: String, required: true},
    userId: {type: ObjectId, required:true},
    createdAt: {type: Date, "default": Date.now}
});
