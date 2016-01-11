"use strict";

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
}

var config = require('config');
var co = require('co');
var express = require('express');
var winston = require('winston');
var BearerStrategy = require('passport-http-bearer').Strategy;
var _ = require('underscore');
var morgan = require('morgan');
var serveStatic = require('serve-static');
var Path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var passport = require('passport');
var logger = require('./common/logger');
var createDomain = require('domain').create;
var Const = require("./Const");
var User = require("./models").User;
var BearerToken = require("./models").BearerToken;
var UnauthorizedError = require("./common/errors").UnauthorizedError;
var ForbiddenError = require("./common/errors").ForbiddenError;


passport.use(new BearerStrategy(function(token, done) {
    co(function* () {
        var token = yield BearerToken.findById(token);
        if (!token) {
            return done(null, false);
        }
        var user = yield User.findById(token.userId);
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    }).catch(done);
}));

var app = express();
app.set('port', config.WEB_SERVER_PORT);
app.use(serveStatic(Path.join(__dirname, '../../restskill-app')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function(req, res, next) {
    var domain = createDomain();
    domain.add(req);
    domain.add(res);
    domain.run(function() {
        next();
    });
    domain.on('error', function(e) {
        next(e);
    });
});

//JSONP endpoints
//app.get("/config", function (req, res) {
//    res.jsonp(config.PUBLIC);
//});
//app.get("/me", function (req, res) {
//    if (req.user) {
//        res.jsonp(req.user.toJsonResponse());
//    } else {
//        res.jsonp({});
//    }
//});

app.use(morgan('dev'));


function loadRouter(path, middlewares, filename) {
    var routes = require(filename);
    var router = new express.Router();
    middlewares.forEach(middleware => router.use(middleware));
    _.each(routes, function (route, path) {
        _.each(route, function (endpoint, method) {
            var ctrl = require("./controllers/" + endpoint.ctrl);
            if (!ctrl[endpoint.method]) {
                throw new Error(`method ${endpoint.method} not found in controller ${endpoint.ctrl}`);
            }
            router[method](path, [
                function (req, res, next) {
                    if (endpoint.public) {
                        return next();
                    }
                    if (!req.user) {
                        return next(new UnauthorizedError());
                    }
                    next();
                },
                ctrl[endpoint.method]
            ]);
        });
    });
    app.use(path, router);
}


//api is session based
var sessionMiddlewares = [
    session({
        resave: true,
        saveUninitialized: true,
        secret: config.SESSION_SECRET,
        store: new MongoStore({url: config.MONGODB_URL})
    }),
    passport.initialize(),
    passport.session()
];
loadRouter("/api", sessionMiddlewares, "./api-routes.json");

//cli api is JWT token based
var bearerMiddlewares = [
    function (req, res, next) {
        if (!req.headers.authorization) {
            return next();
        }
        passport.authenticate('bearer', { session: false })(req, res, next);
    }
];
loadRouter("/cli-api", bearerMiddlewares, "./cli-api-routes.json");

app.use(function (req, res) {
    res.status(404).json({error: "route not found"});
});

app.use(function (err, req, res, next) {//jshint ignore:line
    logger.logFullError(err, req.method + " " + req.url);
    res.status(err.httpStatus || 500).json({
        error: err.message
    });
});

app.listen(app.get('port'), function () {
    winston.info('Express server listening on port %d in %s mode', app.get('port'),  process.env.NODE_ENV);
});