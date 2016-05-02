'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


module.exports = new Schema({
  _id: { type: String, required: true },
  dockerImage: { type: String, required: true },
    // from latest to old order
  versions: [String]
});
