'use strict';

const _ = require('underscore');
const helper = require('../common/helper');
const NotFoundError = require('../common/errors').NotFoundError;
const Problem = require('../models').Problem;
const UserStat = require('../models').UserStat;
const UserStatAttempt = require('../models').UserStatAttempt;

// Exports
module.exports = {
  searchProblems: helper.wrapExpress(searchProblems),
  getProblem: helper.wrapExpress(getProblem)
};

function* searchProblems(req, res) {
  var problems = yield Problem.find({}).select('-runtime -content -examples -swaggerSpecs');
  if (req.user) {
    var result = yield [
      UserStat.find({ userId: req.user.id }),
      UserStatAttempt.find({ userId: req.user.id, language: null, technology: null })
    ];
    var userStatMap = _.indexBy(result[0], 'problemId');
    var userStatAttemptMap = _.indexBy(result[1], 'problemId');
    problems = problems.map(problem => {
      problem = problem.toJSON();
      if (userStatMap[problem.id]) {
        problem.solved = true;
      } else if (userStatAttemptMap[problem.id]) {
        problem.attempted = true;
      }
      return problem;
    });
  }
  res.json(problems);
}

function* getProblem(req, res) {
  var problem = yield Problem.findById(req.params.id);
  if (!problem) {
    throw new NotFoundError('Problem not found');
  }
  res.json(problem);
}
