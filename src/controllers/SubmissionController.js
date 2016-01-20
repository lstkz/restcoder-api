"use strict";

const _  = require('underscore');
const config  = require('config');
const multer = require("multer");
const helper = require("../common/helper");
const BadRequestError =  require("../common/errors").BadRequestError;
const validate =  require("../common/validator").validate;
const SubmissionService =  require("../services/SubmissionService");
const Submission = require("../models").Submission;
const socket = require("../socket");

const storage = multer.diskStorage({
    destination: config.STORAGE_PATH,
    filename: function (req, file, cb) {
        cb(null, 'submission' + '-' + Date.now() + ".zip");
    }
});
const upload = multer({limits: {fileSize: config.SUBMISSION_MAX_SIZE}, storage: storage});

module.exports = {
    submit: [upload.single("file"), helper.wrapExpress(submit)],
    notifyProgress: helper.wrapExpress(notifyProgress),
    submitTestResult: helper.wrapExpress(submitTestResult)
};

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
    var result = yield SubmissionService.submitCode(req.user.id, req.file.path, submission);
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
    if (submission.result !== "PENDING") {
        throw new BadRequestError("Submission is not pending");
    }
    validate(req.body, {
        result: "ShortString",
        errorMessage: "ShortString?",
        testLogUrl: "ShortString?",
        unitTestResult: "AnyObject"
    });
    _.extend(submission, req.body);
    yield submission.save();
    res.status(204).end();
}
