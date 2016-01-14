"use strict";

var _ = require("underscore");
var helper = require("../common/helper");
var Problem = require("../models").Problem;
var NotFoundError =  require("../common/errors").NotFoundError;


function* searchProblems(req, res) {
    res.json(yield Problem.find({}));
}

function* getProblem(req, res) {
    var problem = yield Problem.findById(req.params.id);
    if (!problem) {
        throw new NotFoundError("Problem not found");
    }
    res.json(problem);
}

module.exports = {
    searchProblems: helper.wrapExpress(searchProblems),
    getProblem: helper.wrapExpress(getProblem)
};