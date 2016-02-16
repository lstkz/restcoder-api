
'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;


var schema = new Schema({
    userId: {type: ObjectId, required: true},
    problemId: {type: Number, required: true}
});

schema.index({ userId: 1, problemId: 1 });

module.exports = schema;