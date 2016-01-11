
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlatformInfoSchema = new Schema({
    name: {type: String, required: true},
    codeTemplate: {type: String, ref: "CodeTemplate"}
});

module.exports = new Schema({
    _id: {type: Number, required: true},
    name: {type: String, required: true, unique: true},
    content: {type: String, required: true},
    platforms: {type: [PlatformInfoSchema]}
});
