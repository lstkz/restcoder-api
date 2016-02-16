"use strict";

const _ = require("underscore");
const logger = require("../common/logger");
const User = require("../models").User;
const UserStat = require("../models").UserStat;
const UserStatAttempt = require("../models").UserStatAttempt;
const Submission = require("../models").Submission;
const Problem = require("../models").Problem;
const Service = require("../models").Service;

//Exports
module.exports = {
    scoreSubmission,
    recalculateStats
};

var scoring = {
    "Very Easy": 1,
    "Easy": 2,
    "Medium": 4,
    "Hard": 7
};

/**
 * Check if stats with given criteria exists and create if not
 * @param criteria
 * @param [model]
 * @returns {*} null if stats was created or a stats instance if exists
 * @private
 */
function* _checkStatsExists(criteria, model) {
    if (!model) {
        model = UserStat;
    }
    return yield model.findOneAndUpdate(criteria, {$setOnInsert: criteria}, {new: false, upsert: true});
}

/**
 * Increase attempts and unique attempts stats
 * @param submission
 * @private
 */
function* _increaseAttempt(submission) {
    yield Problem.findByIdAndUpdate(submission.problemId, {$inc: {'stats.attempts': 1}});
    yield User.findByIdAndUpdate(submission.userId, {$inc: {'stats.submissions': 1}});
    var exists = yield _checkStatsExists({
        problemId: submission.problemId,
        userId: submission.userId
    }, UserStatAttempt);
    if (exists) {
        return;
    }
    yield Problem.findByIdAndUpdate(submission.problemId, {$inc: {'stats.uniqueAttempts': 1}});
}


/**
 * Increase stats for a solved problem (not related to language or technology)
 * @param submission
 * @param score
 * @private
 */
function* _scoreProblem(submission, score) {
    yield Problem.findByIdAndUpdate(submission.problemId, {$inc: {'stats.totalSolved': 1}});
    var exists = yield _checkStatsExists({
        problemId: submission.problemId,
        userId: submission.userId,
        language: null,
        technology: null
    });
    if (exists) {
        return;
    }
    yield [
        User.findByIdAndUpdate(submission.userId, {$inc: {'stats.solvedProblems': 1, 'stats.score': score}}),
        Problem.findByIdAndUpdate(submission.problemId, {$inc: {'stats.totalUniqueSolved': 1}})
    ];
}

/**
 * Increase score related to used language
 * @param submission
 * @param score
 * @private
 */
function* _scoreLanguage(submission, score) {
    var exists = yield _checkStatsExists({
        problemId: submission.problemId,
        userId: submission.userId,
        language: submission.language,
        technology: null
    });
    if (exists) {
        return;
    }
    var path = 'stats.languages.' + submission.language;
    yield User.findByIdAndUpdate(submission.userId, {$inc: {[path]: score}});
}

/**
 * Increase score related to used technology/service
 * @param submission
 * @param score
 * @private
 */
function* _scoreTechnology(submission, score) {
    yield submission.usedServices.map(name => function* () {
        var service = yield Service.findByIdOrError(name);
        if (!service.rank) {
            return;
        }
        var exists = yield _checkStatsExists({
            problemId: submission.problemId,
            userId: submission.userId,
            language: submission.language,
            technology: service.rank.name
        });
        if (exists) {
            return;
        }
        var path = 'stats.technologies.' + service.rank.name;
        yield User.findByIdAndUpdate(submission.userId, {$inc: {[path]: score}});
    });
}

/**
 * Compute scoring and stats for a submission
 * @param submissionId
 */
function* scoreSubmission(submissionId) {
    var submission = yield Submission.findByIdOrError(submissionId);
    var problem = yield Problem.findByIdOrError(submission.problemId);
    var score = scoring[problem.level];
    if (!score) {
        throw new Error("Invalid level: " + problem.level);
    }

    yield _increaseAttempt(submission);

    if (submission.result !== "PASS") {
        return;
    }


    yield [
        _scoreProblem(submission, score),
        _scoreLanguage(submission, score),
        _scoreTechnology(submission, score)
    ];
}


function* recalculateStats() {
    yield [
        User.update({}, {
            stats: {
                score: 0,
                solvedProblems: 0,
                submissions: 0,
                languages: {},
                technologies: {}
            }
        }, {multi: true}),
        UserStat.remove({}),
        UserStatAttempt.remove({}),
        Problem.update({}, {
            stats: {
                attempts: 0,
                uniqueAttempts: 0,
                totalSolved: 0,
                totalUniqueSolved: 0
            }
        }, {multi: true})
    ];
    var total = yield Submission.count({});
    var maxPageSize = 1000;
    var pages = Math.ceil(total / maxPageSize);
    var actions =  _.range(0, pages).map(page => function* () {
        var submissions = yield Submission.find({}).select("_id").skip(page * maxPageSize).limit(maxPageSize);
        yield submissions.map(s => function* () {
            try {
                yield scoreSubmission(s.id);
            } catch (e) {
                logger.logFullError(e, "scoreSubmission: id=" + s.id);
            }
        });
    });
    for (var i = 0; i < actions.length; i++) {
        yield actions[i];
    }
}