
"use strict";

const socketIO = require('socket.io');
const co = require('co');
const sharedSession = require("express-socket.io-session");
const Submission = require("./models").Submission;
const BearerToken = require("./models").BearerToken;
const logger = require('./common/logger');
const validate = require('./common/validator').validate;

module.exports = {
    startUp,
    notifyProgress
};


var io;
var nsTester;
var nsCli;


function _onEvent(ns, name, fn) {
    ns.on(name, function (socket) {
        co(fn(socket)).catch(e => logger.logFullError(e, `Event: ${name}`));
    });
}

function notifyProgress(submissionId, data) {
    nsCli.to(`submission_${submissionId}`).emit('progress', data);
}

function startUp(server, session) {
    io = socketIO(server);
    //io.use(sharedSession(session));

    nsTester = io.of('/tester');
    nsTester.use((socket, next) => {
        co(function* () {
            if (!socket.handshake.query.notifyKey) {
                throw new Error("notifyKey required");
            }
            var submission = yield Submission.findOne({notifyKey: socket.handshake.query.notifyKey});
            if (!submission) {
                throw new Error("Invalid submission key");
            }
            socket.submissionId = submission.id;
            next();
        }).catch(next);
    });
    nsTester.on('connection', function(socket){
        socket.on("progress", function (data) {
            logger.debug(`progress from submission ${socket.submissionId}`);
            nsCli.to(`submission_${socket.submissionId}`).emit({foo: "bar"});
        });
    });

    nsCli = io.of('/cli');
    nsCli.use((socket, next) => {
        co(function* () {
            if (!socket.handshake.query.token) {
                throw new Error("token required");
            }
            var token = yield BearerToken.findById(socket.handshake.query.token);
            if (!token) {
                throw new Error("Invalid token");
            }
            socket.userId = token.userId;
            next();
        }).catch(next);
    });
    nsCli.on('connection', function(socket){
        socket.on("join", function (data) {
            logger.debug(`join from user ${socket.userId}`);
            co(function* () {
                validate(data, {submissionId: "ObjectId"});
                var submission = yield Submission.findByIdOrError(data.submissionId);
                if (!submission.userId.equals(socket.userId)) {
                    throw new Error("Invalid user");
                }
                socket.join(`submission_${submission.id}`);
            }).catch(e => logger.logFullError(e, `Event: join, user: ${socket.userId}`));
        });
    });
}