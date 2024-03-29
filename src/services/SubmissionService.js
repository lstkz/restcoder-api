'use strict';

const Joi = require('joi');
const AdmZip = require('adm-zip');
const Path = require('path');
const fs = require('fs');
const config = require('config');
const semver = require('semver');
const _ = require('underscore');
const AWS = require('aws-sdk-promise');
const NotFoundError = require('../common/errors').NotFoundError;
const BadRequestError = require('../common/errors').BadRequestError;
const validate = require('../common/validator').validate;
const SubmissionQueueService = require('./SubmissionQueueService');
const Problem = require('../models').Problem;
const Submission = require('../models').Submission;
const Language = require('../models').Language;
const Service = require('../models').Service;
const User = require('../models').User;
const SubmissionStatus = require('../Const').SubmissionStatus;
const helper = require('../common/helper');
const RateLimitService = require('./RateLimitService');

const s3 = new AWS.S3();

module.exports = {
  submitCode,
  searchUserSubmissions
};


function* submitCode(userId, submissionPath, submission) {
  const user = yield User.findByIdOrError(userId);
  // check if file is a valid zip file
  var zip;
  try {
    zip = new AdmZip(submissionPath);
  } catch (ignore) {
    throw new BadRequestError('Invalid zip');
  }

  var problem = yield Problem.findByIdOrError(submission.problemId);
  var language = yield Language.findByIdOrError(submission.language.name);
  var version = semver.maxSatisfying(language.versions, submission.language.version);
  if (!version) {
    let versions = language.versions.join(', ');
    throw new BadRequestError(`Unsupported version: "${submission.language.version}". Valid versions: ${versions}`);
  }

  // validate processes
  var userProcesses = _.pluck(submission.processes, 'name');
  var requiredProcesses = _.keys(problem.runtime.processes);
  var extra = _.difference(userProcesses, requiredProcesses);
  if (extra.length) {
    throw new BadRequestError([
      `Following processes are not allowed: ${extra.join(', ')}. `,
      `Allowed processes: ${requiredProcesses.join(', ')}`
    ].join(''));
  }
  var missing = _.difference(requiredProcesses, userProcesses);
  if (missing.length) {
    throw new BadRequestError(`Missing processes: ${missing.join(', ')}`);
  }

  const servicesMapping = problem.runtime.services.base || {};

  // validate services
  const selectServices = problem.runtime.services.select;
  if (selectServices){ 
    _.each(selectServices, (list, name) => {
      const current = submission.services[name];
      if (!current) {
        throw new BadRequestError(`service ${name} is required`);
      }
      if (!_.contains(list, current)) {
        throw new BadRequestError(`service ${current} is not allowed for ${name}`);
      }
    });
    // and services chosen by user
    _.extend(servicesMapping, submission.services);
  }

  var usedServices = [];
  var services = [];
  // add base services
  yield _.map(servicesMapping, (name, alias) => function*() {
    usedServices.push(name);
    var service = yield Service.findByIdOrError(name);
    var ret = _.pick(service, 'dockerImage', 'envName', 'limits', 'url', 'port', 'doneText', 'id');
    ret.link = problem.runtime.link[alias];
    services.push(ret);
  });

  // do rate limit check if whole submission data is valid
  yield RateLimitService.check(userId);

  var stream = fs.createReadStream(submissionPath);
  var key = 'app/' + user.username + '_' + helper.randomUniqueString() + '.zip';
  var params = {
    Bucket: config.S3_BUCKET,
    Key: key,
    Body: stream,
    ContentType: 'application/octet-stream'
  };
  yield s3.putObject(params).promise();
  params = {
    Bucket: config.S3_BUCKET,
    Key: key
  };

  const submissionUrl = s3.getSignedUrl('getObject', params).split('?')[0];

  var notifyKey = helper.randomUniqueString();

  var submissionObj = {
    problemId: submission.problemId,
    userId: userId,
    url: submissionUrl,
    notifyKey: notifyKey,
    status: SubmissionStatus.PENDING,
    language: submission.language.name,
    languageVersion: version,
    usedServices
  };
  var createdSubmission = yield Submission.create(submissionObj);
  var commands = {};
  submission.processes.forEach(item => {
    commands[item.name] = item.command;
  });
  var message = {
    submissionId: createdSubmission.id,
    language: submission.language.name,
    notifyKey: notifyKey,
    dockerImage: `${language.dockerImage}:${version}`,
    sourceUrl: submissionObj.url,
    commands: commands,
    testCase: problem.runtime.testSpec.testCase,
    processes: problem.runtime.processes,
    customEnv: problem.runtime.customEnv || {},
    services: services,
    apiBaseUrl: config.API_BASE_URL
  };

  yield SubmissionQueueService.addToQueue(message);
  return createdSubmission;
}

submitCode.schema = {
  userId: Joi.objectId().required(),
  submissionPath: Joi.string().required(),
  submission: Joi.object().keys({
    problemId: Joi.number().required(),
    language: Joi.object().keys({
      name: Joi.shortString().required(),
      version: Joi.shortString().required(),
    }).required(),
    processes: Joi.array().items({
      name: Joi.shortString().required(),
      command: Joi.shortString().required(),
    }),
    services: Joi.object().default({}),
  }).required(),
};

function* searchUserSubmissions(username, offset, limit) {
  const user = yield User.getByUsername(username);
  const [submissions, total] = yield [
    Submission
      .find({ userId: user.id })
      .populate('problemId', '_id name')
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: 'desc' }),
    Submission.count({ userId: user.id })
  ];
  const items = submissions.map((item, i) => ({
    nr: total - offset - i,
    language: item.language,
    usedServices: item.usedServices,
    createdAt: item.createdAt,
    result: item.result,
    problem: item.problemId.toJSON()
  }));
  return {
    total,
    offset,
    limit,
    totalPages: Math.ceil(total / limit),
    pageNumber: Math.floor(offset / limit),
    items
  };
}

searchUserSubmissions.schema = {
  username: Joi.string().required(),
  offset: Joi.offset(),
  limit: Joi.limit()
};
