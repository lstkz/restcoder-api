
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

//user stat for successfully solver problems

var schema = new Schema({
    score: {type: Number, required: true},
    userId: {type: ObjectId, required: true},
    problemId: {type: Number, required: true},
    language: {type: String, required: false},
    technology: {type: String, required: false}
});

schema.index({ userId: 1, problemId: 1, language: 1, technology: 1 });

module.exports = schema;