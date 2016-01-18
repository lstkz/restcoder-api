"use strict";

const config  = require('config');
const _ = require("underscore");
const helper = require("../common/helper");
const Problem = require("../models").Problem;
const NotFoundError =  require("../common/errors").NotFoundError;
const BadRequestError =  require("../common/errors").BadRequestError;
const validate =  require("../common/validator").validate;
const ProblemService =  require("../services/ProblemService");

const storage = multer.diskStorage({
    destination: config.STORAGE_PATH,
    filename: function (req, file, cb) {
        cb(null, 'submission' + '-' + Date.now() + ".zip");
    }
});
const upload = multer({limits: {fileSize: config.SUBMISSION_MAX_SIZE}, storage: storage});

module.exports = {
    searchProblems: helper.wrapExpress(searchProblems),
    getProblem: helper.wrapExpress(getProblem),
    submit: [upload.single("file"), helper.wrapExpress(submit)],
    notifyProgress: helper.wrapExpress(notifyProgress),
    submitTestResult: helper.wrapExpress(submitTestResult)
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


function* submit(req, res) {
    validate({ id: req.params.id }, { id: "IntegerId" });
    if (!req.file) {
        throw new BadRequestError("file required");
    }
    var submission;
    try {
        submission = JSON.parse(req.body.submission);
    } catch(e) {
        throw new BadRequestError("submission missing or invalid json object");
    }
    submission.problemId = Number(req.params.id);
    var result = yield CLIService.submitCode(req.user.id, req.file.path, submission);
    res.json({
        submissionId: result.id
    });
}

function* notifyProgress(req, res) {
    var submission = yield Submission.findOne({notifyKey: req.params.notifyKey});
    if (!submission) {
        throw new BadRequestError("Invalid notifyKey");
    }
    socket.notifyProgress(submission.id, req.body);
    res.status(204).end();
}

function* submitTestResult(req, res) {
    var submission = yield Submission.findOne({notifyKey: req.params.notifyKey});
    if (!submission) {
        throw new BadRequestError("Invalid notifyKey");
    }
    validate(req.body, {
        problemId: "IntegerId"
    });
}
