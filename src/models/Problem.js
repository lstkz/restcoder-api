
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Mixed = mongoose.Schema.Types.Mixed;

var SwaggerSpecSchema = new Schema({
    name: {type: String, required: true},
    content: {type: String}
});

var RuntimeSchema = new Schema({
    services: new Schema({
        //map <name>:<Service#id>
        base: Mixed
    }),
    testSpec: new Schema({
        testCase: {type: String, required: true}
    }),
    //map: <process_name>: <options>
    //<options> is {instances: Number}
    processes: Mixed,
    //map <service>: [<process_name>]
    link: Mixed
});

module.exports = new Schema({
    _id: {type: Number, required: true},
    slug: {type: String, required: true, unique: true},
    name: {type: String, required: true, unique: true},
    content: {type: String, required: true},
    swaggerSpecs: {type: [SwaggerSpecSchema]},
    examples: {type: [Schema.Types.Mixed]},
    runtime: RuntimeSchema
});
