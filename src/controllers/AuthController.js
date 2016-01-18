"use strict";

const helper = require("../common/helper");
const SecurityService = require("../services/SecurityService");


//Exports
module.exports = {
    register: helper.wrapExpress(register),
    login: helper.wrapExpress(login)
};

function* register(req, res) {
    var user = yield SecurityService.register(req.body);
    var token = yield SecurityService.createBearerToken(user.id);
    res.json({
        token: token
    });
}

function* login(req, res) {
    var user = yield SecurityService.authenticate(req.body.username, req.body.password);
    var token = yield SecurityService.createBearerToken(user.id);
    res.json({
        token: token
    });
}
