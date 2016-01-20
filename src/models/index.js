'use strict';

const _ = require("underscore");
const config = require('config');
const mongoose = require('mongoose');
const conn = mongoose.connect(config.MONGODB_URL).connection;
const NotFoundError =  require("../common/errors").NotFoundError;

var models = {
    User: createModel('User'),
    Problem: createModel('Problem'),
    BearerToken: createModel('BearerToken'),
    CodeTemplate: createModel('CodeTemplate'),
    Submission: createModel('Submission'),
    Language: createModel('Language'),
    Service: createModel('Service')
};

function createModel(name) {
    var schema = require('./' + name);
    schema.statics.findByIdOrError = function* (id, projection, options) {
        var item = yield this.findById(id, projection, options);
        if (!item) {
            throw new NotFoundError(`${name} not found with id=${id}`);
        }
        return item;
    };
    return conn.model(name, schema);
}

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
