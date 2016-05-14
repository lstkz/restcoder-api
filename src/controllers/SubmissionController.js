'use strict';

const _ = require('underscore');
const config = require('config');
const multer = require('multer');
const helper = require('../common/helper');
const BadRequestError = require('../common/errors').BadRequestError;
const validate = require('../common/validator').validate;
const SubmissionService = require('../services/SubmissionService');
const ScoringService = require('../services/ScoringService');
const Submission = require('../models').Submission;
const Problem = require('../models').Problem;
const User = require('../models').User;
const socket = require('../socket');

const storage = multer.diskStorage({
  destination: config.STORAGE_PATH,
  filename: function (req, file, cb) {
    cb(null, 'submission' + '-' + Date.now() + '.zip');
  }
});
const upload = multer({ limits: { fileSize: config.SUBMISSION_MAX_SIZE }, storage: storage });

module.exports = {
  submit: [upload.single('file'), submit],
  notifyProgress,
  submitTestResult,
  getRecentSubmissions,
  searchUserSubmissions
};


function* getRecentSubmissions(req, res) {
  var submissions = yield Submission
        .find({})
        .select({
          problemId: 1,
          userId: 1,
          language: 1,
          createdAt: 1,
          result: 1,
          errorMessage: 1
        })
        .sort('-createdAt')
        .limit(5);
  submissions = yield submissions.map(submission => function* () {
    submission = submission.toJSON();
    submission.problem = yield Problem.findByIdOrError(submission.problemId, 'name');
    submission.user = yield User.findByIdOrError(submission.userId, 'username');
    return submission;
  });
  res.json(submissions);
}

function* submit(req, res) {
  validate({ id: req.params.id }, { id: 'IntegerId' });
  if (!req.file) {
    throw new BadRequestError('file required');
  }
  var submission;
  try {
    submission = JSON.parse(req.body.submission);
  } catch (e) {
    throw new BadRequestError('submission missing or invalid json object');
  }
  submission.problemId = Number(req.params.id);
  var result = yield SubmissionService.submitCode(req.user.id, req.file.path, submission);
  const problem = yield Problem.findById(result.problemId);
  res.json({
    submissionId: result.id,
    problemId: result.problemId,
    problemName: problem.name,
    language: result.language,
    languageVersion: result.languageVersion,
    usedServices: result.usedServices
  });
}

function* notifyProgress(req, res) {
  var submission = yield Submission.findOne({ notifyKey: req.params.notifyKey });
  if (!submission) {
    throw new BadRequestError('Invalid notifyKey');
  }
  socket.notifyProgress(submission.id, req.body);
  res.status(204).end();
}

function* submitTestResult(req, res) {
  var submission = yield Submission.findOne({ notifyKey: req.params.notifyKey });
  if (!submission) {
    throw new BadRequestError('Invalid notifyKey');
  }
  if (submission.result !== 'PENDING') {
    throw new BadRequestError('Submission is not pending');
  }
  validate(req.body, {
    result: 'ShortString',
    errorMessage: 'ShortString?',
    testLogUrl: 'ShortString?',
    unitTestResult: 'AnyObject'
  });
  _.extend(submission, req.body);
  yield submission.save();
  yield ScoringService.scoreSubmission(submission.id);
  res.status(204).end();
}


function* searchUserSubmissions(req, res) {
  res.json(yield SubmissionService.searchUserSubmissions(req.params.username, req.query.offset, req.query.limit))
}
