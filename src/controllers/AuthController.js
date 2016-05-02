"use strict";

const _ = require('underscore');
const ms = require('ms');
const config = require('config');
const helper = require("../common/helper");
const SecurityService = require("../services/SecurityService");


//Exports
module.exports = {
    register: helper.wrapExpress(register),
    login: helper.wrapExpress(login)
};

function* register(req, res) {
    yield SecurityService.register(req.body);
    res.status(201).end();
}

function* login(req, res) {
    var user = yield SecurityService.authenticate(req.body.username, req.body.password);
    var token = yield SecurityService.createBearerToken(user.id);
    if (req.body.cookie) {
        var opts = {expires: new Date(Date.now() + ms(config.AUTH_COOKIE.EXPIRATION)), httpOnly: true};
        res.cookie(config.AUTH_COOKIE.NAME, token, opts);
    }
    res.json({
        token: token,
        user: user.toJsonResponse()
    });
}
