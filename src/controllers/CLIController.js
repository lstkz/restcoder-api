"use strict";

var _ = require("underscore");
var helper = require("../common/helper");
var CodeTemplate = require("../models").CodeTemplate;
var Problem = require("../models").Problem;
var NotFoundError =  require("../common/errors").NotFoundError;
var BadRequestError =  require("../common/errors").BadRequestError;
var validate =  require("../common/validator").validate;

function* getCodeTemplate(req, res) {
    validate({id: req.params.id}, {id: "IntegerId"});
    var problem = yield Problem.findById(req.params.problemId);
    if (!problem) {
        throw new NotFoundError("Problem not found");
    }
    var platform = _.findWhere(problem.platforms, {name: req.params.platform});
    if (!platform) {
        throw new BadRequestError(`Platform "${req.params.platform}" is not supported for this problem`);
    }
    var codeTemplate = yield CodeTemplate.findById(platform.codeTemplate);
    if (!codeTemplate) {
        throw new NotFoundError("Code template not found");
    }
    res.json(codeTemplate);
}

module.exports = {
    getCodeTemplate: helper.wrapExpress(getCodeTemplate)
};