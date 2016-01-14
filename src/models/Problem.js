
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlatformInfoSchema = new Schema({
    name: {type: String, required: true},
    codeTemplate: {type: String, ref: "CodeTemplate"}
});

var SwaggerSpecSchema = new Schema({
    name: {type: String, required: true},
    content: {type: String}
});

var TestSpecSchema = new Schema({
    suitName: {type: String},
    content: {type: String}
});

module.exports = new Schema({
    _id: {type: Number, required: true},
    slug: {type: String, required: true, unique: true},
    name: {type: String, required: true, unique: true},
    content: {type: String, required: true},
    platforms: {type: [PlatformInfoSchema]},
    swaggerSpecs: {type: [SwaggerSpecSchema]},
    examples: {type: [Schema.Types.Mixed]}
});
