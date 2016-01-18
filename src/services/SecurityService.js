"use strict";


const config = require('config');
const _ = require('underscore');
const crypto = require('mz/crypto');
const NotFoundError =  require("../common/errors").NotFoundError;
const ValidationError =  require("../common/errors").ValidationError;
const UnauthorizedError =  require("../common/errors").UnauthorizedError;
const validate =  require("../common/validator").validate;
const User = require("../models").User;
const BearerToken = require("../models").BearerToken;
const helper = require("../common/helper");

module.exports = {
    register,
    authenticate,
    createBearerToken
};

function* register(values) {
    validate(values, {
        username: {type: "String", minLength: 3, maxLength: 12},
        password: {type: "String", minLength: 4},
        email: {type: "email"}
    });
    var existing = yield User.findOne({email_lowered: values.email.toLowerCase()});
    if (existing) {
        throw new ValidationError("Email address is already registered");
    }
    existing = yield User.findOne({username_lowered: values.username.toLowerCase()});
    if (existing) {
        throw new ValidationError("Username is already registered");
    }
    var salt = yield crypto.randomBytes(config.SECURITY.SALT_LENGTH);
    salt = salt.toString("hex");
    var hash =  yield crypto.pbkdf2(values.password, salt, config.SECURITY.ITERATIONS, config.SECURITY.PASSWORD_LENGTH);
    values.salt = salt.toString("hex");
    values.password = hash.toString("hex");
    values.email_lowered = values.email.toLowerCase();
    values.username_lowered = values.username.toLowerCase();
    var user = new User(values);
    yield user.save();
    return user;
}

function* authenticate(username, password) {
    validate({username, password}, {
        username: "ShortString",
        password: "ShortString"
    });
    var errorMsg = "Invalid username or password";
    var user = yield User.findOne({username_lowered: username.toLowerCase()});
    if (!user) {
        throw new UnauthorizedError(errorMsg);
    }
    var hash =  yield crypto.pbkdf2(password, user.salt, config.SECURITY.ITERATIONS, config.SECURITY.PASSWORD_LENGTH);
    hash = hash.toString("hex");
    if (hash !== user.password) {
        throw new UnauthorizedError(errorMsg);
    }
    return user;
}

function* createBearerToken(userId) {
    validate({userId}, {userId: "ObjectId"});
    var token = helper.randomUniqueString();
    yield BearerToken.create({userId, _id: token});
    return token;
}