
'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Mixed = mongoose.Schema.Types.Mixed;

var SwaggerSpecSchema = new Schema({
  name: { type: String, required: true },
  content: { type: String }
});

var RuntimeSchema = new Schema({
  services: new Schema({
    // map <name>:<Service#id>
    base: Mixed,

    // map <name>:[<Service#id>]
    select: Mixed
  }),
  testSpec: new Schema({
    testCase: { type: String, required: true }
  }),
  // map: <process_name>: <options>
  // <options> is {instances: Number}
  processes: Mixed,
  // map <service>: [<process_name>]
  link: Mixed,

  // map <process_name>: <key value map>
  customEnv: Mixed
});

var StatsSchema = new Schema({
  attempts: { type: Number, default: 0 },
  uniqueAttempts: { type: Number, default: 0 },
  totalSolved: { type: Number, default: 0 },
  totalUniqueSolved: { type: Number, default: 0 }
});

module.exports = new Schema({
  _id: { type: Number, required: true },
  slug: { type: String, required: true, unique: true },
  tags: { type: [String], 'default': [] },
  level: { type: String, required: true, 'enum': ['Very Easy', 'Easy', 'Medium', 'Hard'] },
  name: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  swaggerSpecs: { type: [SwaggerSpecSchema] },
  examples: { type: [Schema.Types.Mixed] },
  runtime: RuntimeSchema,
  forumTopicUrl: String,
  postmanCollectionId: String,
  localSetup: String,
  c9Setup: String,

  stats: { type: StatsSchema, default: {} }
});
