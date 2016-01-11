'use strict';

var _ = require("underscore");
var config = require('config');
var mongoose = require('mongoose');
var conn = mongoose.connect(config.MONGODB_URL).connection;

var models = {
};

function addModel(name) {
    models[name] = conn.model(name, require('./' + name));
}

addModel('User');
addModel('Problem');
addModel('BearerToken');
addModel('CodeTemplate');

_.each(models, function (model) {
    model.schema.options.minimize = false;
    model.schema.options.toJSON = {
        /**
         * Transform model to json object
         * @param {Object} doc the mongoose document which is being converted
         * @param {Object} ret the plain object representation which has been converted
         * @returns {Object} the transformed object
         */
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    };
});

module.exports = models;
