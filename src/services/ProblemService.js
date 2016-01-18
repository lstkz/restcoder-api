"use strict";


const AdmZip = require('adm-zip');
const Path = require('path');
const config = require('config');
const semver = require('semver');
const _ = require('underscore');
const NotFoundError =  require("../common/errors").NotFoundError;
const BadRequestError =  require("../common/errors").BadRequestError;
const validate =  require("../common/validator").validate;
const SubmissionQueueService = require("./SubmissionQueueService");
const Problem = require("../models").Problem;
const Submission = require("../models").Submission;
const Language = require("../models").Language;
const SubmissionStatus = require("../Const").SubmissionStatus;
const helper = require("../common/helper");

module.exports = {
    submitCode
};


function* submitCode(userId, submissionPath, submission) {
    validate({userId, submissionPath, submission},
        {
            userId: "ObjectId",
            submissionPath: "String",
            submission: {
                problemId: "IntegerId",
                language: {
                    name: "ShortString",
                    version: "ShortString"
                },
                processes: [{
                    name: "ShortString",
                    command: "ShortString"
                }],
                services: {
                    type: ["ShortString"],
                    required: false,
                    empty: true
                }
            }
        });

    //check if file is a valid zip file
    var zip;
    try {
        zip = new AdmZip(submissionPath);
    } catch (ignore) {
        throw new BadRequestError("Invalid zip");
    }

    var problem = yield Problem.findByIdOrError(submission.problemId);
    var language = yield Language.findByIdOrError(submission.language.name);
    var version = semver.maxSatisfying(language.versions, submission.language.version);
    if (!version) {
        let versions = language.versions.join(", ");
        throw new BadRequestError(`Unsupported version: "${submission.language.version}". Valid versions: ${versions}`);
    }

    //validate processes
    var userProcesses = _.pluck(submission.processes, 'name');
    var requiredProcesses = _.keys(problem.runtime.processes);
    var extra = _.difference(userProcesses, requiredProcesses);
    if (extra.length) {
        throw new BadRequestError([
            `Following processes are not allowed: ${extra.join(', ')}. `,
            `Allowed processes: ${requiredProcesses.join(', ')}`
        ].join(""));
    }
    var missing = _.difference(requiredProcesses, userProcesses);
    if (missing.length) {
        throw new BadRequestError(`Missing processes: ${missing.join(', ')}`);
    }

    //validate services
    //TODO

    var submissionUrl = config.SUBMISSION_DOWNLOAD_URL + Path.basename(submissionPath);

    var notifyKey = helper.randomUniqueString();

    var submissionObj = {
        problem: submission.problemId,
        userId: userId,
        url: submissionUrl,
        notifyKey: notifyKey,
        status: SubmissionStatus.PENDING
    };
    var createdSubmission = yield Submission.create(submissionObj);
    var commands = {};
    submission.processes.forEach(item => {
        commands[item.name] = item.command;
    });
    var message = {
        submissionId: createdSubmission.id,
        notifyKey: notifyKey,
        dockerImage: `${language.dockerImage}:${version}`,
        sourceUrl: submissionObj.url,
        commands: commands,
        testCase: problem.runtime.testSpec.testCase,
        processes: problem.runtime.processes,
        link: problem.runtime.link,
        services: []//TODO
    };

    yield SubmissionQueueService.addToQueue(message);
    return createdSubmission;
}