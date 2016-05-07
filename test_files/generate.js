/**
 * Randomize users and test stats
 */
"use strict";

const _ = require("underscore");
const co = require("co");
const faker = require("faker");
const SecurityService = require("../src/services/SecurityService");
const ScoringService = require("../src/services/ScoringService");
const User = require("../src/models").User;
const Submission = require("../src/models").Submission;
const Problem = require("../src/models").Problem;

const USER_COUNT = 100;
const PROBLEMS_PER_USER_MIN = 1;
const PROBLEMS_PER_USER_MAX = 4;
const SUBMISSIONS_PER_USER = 4;
const PASS = "pass";

const LANGUAGES = ["nodejs", "ruby", "python", "go", "java"];
var notifyKey = 0;

co(function* () {
    yield User.remove({});
    yield Submission.remove({});
    var problems = yield Problem.find({});
    yield _.range(1, USER_COUNT + 1).map(nr => function* () {
        var username = "user" + nr;
        var user = yield SecurityService.register({
            username: username,
            email: username + "@gmail.com",
            password: PASS
        });
        var problemCount = _.random(PROBLEMS_PER_USER_MIN, PROBLEMS_PER_USER_MAX);
        var userProblems = _.sample(problems, problemCount);
        yield userProblems.map(p => {
            return _.range(0, SUBMISSIONS_PER_USER).map(() => {
                var services = p.runtime.services;
                var usedServices = _.values(services.base);
                return Submission.create({
                    problemId: p.id,
                    userId: user.id,
                    url: "fake",
                    notifyKey: "fake_" + user.username + "_" + (++notifyKey),
                    usedServices: usedServices,
                    language: _.sample(LANGUAGES),
                    createdAt: faker.date.recent(),
                    result: _.sample(["FAIL", "PASS"])
                });
            });
        });
    });
    yield ScoringService.recalculateStats();
    console.log("DONE");
    process.exit();
}).catch(e => {
    console.log(e);
    console.log(e.stack);
    process.exit();
});
