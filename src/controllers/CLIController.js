"use strict";


const config  = require('config');
const multer  = require('multer');
const _ = require("underscore");
const helper = require("../common/helper");
const CodeTemplate = require("../models").CodeTemplate;
const Problem = require("../models").Problem;
const NotFoundError =  require("../common/errors").NotFoundError;
const BadRequestError =  require("../common/errors").BadRequestError;
const validate =  require("../common/validator").validate;
const AdmZip = require('adm-zip');

const storage = multer.diskStorage({
    destination: config.STORAGE_PATH,
    filename: function (req, file, cb) {
        cb(null, 'submission' + '-' + Date.now() + ".zip");
    }
});
const upload = multer({limits: {fileSize: config.SUBMISSION_MAX_SIZE}, storage: storage});


module.exports = {
    getCodeTemplate: helper.wrapExpress(getCodeTemplate),
    submit: [upload.single("file"), helper.wrapExpress(submit)]
};



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

function* submit(req, res) {
    validate({ id: req.params.id }, { id: "IntegerId" });
    //validate(req.body,
    //{
    //    language: {
    //        name: "String",
    //        version: "String"
    //    },
    //    processes: [{
    //        name: "String",
    //        command: "String"
    //    }],
    //    services: {
    //        type: ["String"],
    //        required: false,
    //        empty: true
    //    }
    //});
    if (!req.file) {
        throw new BadRequestError("file required");
    }
    var zip;
    try {
        zip = new AdmZip(req.file.path);
    } catch (ignore) {
        throw new BadRequestError("Invalid zip");
    }
    
    var url = config.SUBMISSION_DOWNLOAD_URL + req.file.filename;
    
    res.json({
        url: url
    });
}
