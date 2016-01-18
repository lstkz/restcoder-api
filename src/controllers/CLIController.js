"use strict";


const config  = require('config');
const multer  = require('multer');
const _ = require("underscore");
const helper = require("../common/helper");
const CodeTemplate = require("../models").CodeTemplate;
const Problem = require("../models").Problem;
const Submission = require("../models").Submission;
const NotFoundError =  require("../common/errors").NotFoundError;
const BadRequestError =  require("../common/errors").BadRequestError;
const validate =  require("../common/validator").validate;
const CLIService =  require("../services/CLIService");
const AdmZip = require('adm-zip');
const socket = require("../socket");


//Exports
module.exports = {
    getCodeTemplate: helper.wrapExpress(getCodeTemplate)
};



function* getCodeTemplate(req, res) {
    var codeTemplate = yield CodeTemplate.findByIdOrError(req.params.language + "_base");
    res.json(codeTemplate);
}

