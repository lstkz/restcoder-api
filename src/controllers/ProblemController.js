"use strict";

const helper = require("../common/helper");
const NotFoundError =  require("../common/errors").NotFoundError;
const Problem = require("../models").Problem;

module.exports = {
    searchProblems: helper.wrapExpress(searchProblems),
    getProblem: helper.wrapExpress(getProblem)
};

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
