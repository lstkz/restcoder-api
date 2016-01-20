
'use strict';

const _ = require('underscore');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
    username: {type: String, required: true},
    username_lowered: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    salt: {type: String, required: true},
    email: {type: String, required: true},
    email_lowered: {type: String, required: true, unique: true}
});

module.exports.methods.toJsonResponse = function () {
    return _.pick(this.toJSON(), "id", "username", "email");
};