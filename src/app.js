'use strict';

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
require('./bootstrap');
const config = require('config');
const co = require('co');
const sticky = require('sticky-session');
const express = require('express');
const winston = require('winston');
const BearerStrategy = require('passport-http-bearer').Strategy;
const _ = require('underscore');
const morgan = require('morgan');
const jwt = require('jwt-simple');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const logger = require('./common/logger');
const helper = require('./common/helper');
const createDomain = require('domain').create;
const Const = require('./Const');
const User = require('./models').User;
const BearerToken = require('./models').BearerToken;
const UnauthorizedError = require('./common/errors').UnauthorizedError;
const SubmissionQueueService = require('./services/SubmissionQueueService');
const UserService = require('./services/UserService');


passport.use(new BearerStrategy(function (token, done) {
  co(function* () {
    const bearerToken = yield BearerToken.findById(token);
    if (!bearerToken) {
      return done(null, false);
    }
    const user = yield User.findById(bearerToken.userId);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  }).catch(done);
}));

const app = express();
app.set('port', config.WEB_SERVER_PORT);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(function (req, res, next) {
  const domain = createDomain();
  domain.add(req);
  domain.add(res);
  domain.run(function () {
    next();
  });
  domain.on('error', function (e) {
    next(e);
  });
});

app.use(function (req, res, next) {
  if (req.cookies && req.cookies[config.AUTH_COOKIE.NAME]) {
    co(function* () {
      let token;
      try {
        token = jwt.decode(req.cookies[config.AUTH_COOKIE.NAME], config.JWT_SECRET).token
      } catch (e) {
        next();
        return;
      }
      const bearerToken = yield BearerToken.findById(token);
      if (!bearerToken) {
        return next();
      }
      const user = yield User.findById(bearerToken.userId);
      if (user) {
        req.user = user;
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

app.use(function (req, res, next) {
  res.returnUser = function (userId, token, data) {
    co(UserService.getUserData(userId))
      .then((user) => res.json({user, token, data}))
      .catch(next);
  };
  next();
});

// JSONP endpoints
// app.get("/config", function (req, res) {
//    res.jsonp(config.PUBLIC);
// });
app.get('/me', function (req, res) {
  if (req.user) {
    res.returnUser(req.user.id);
  } else {
    res.jsonp({});
  }
});

app.get('/api/v1/me', function (req, res, next) {
  if (req.user) {
    co(UserService.getUserData(req.user.id)).then((user) => res.json({user})).catch(next);
  } else {
    res.json({
      user: null
    });
  }
});

app.use(morgan('dev'));


function loadRouter(path, middlewares, filename) {
  const routes = require(filename);
  const router = new express.Router();
  middlewares.forEach(middleware => router.use(middleware));
  _.each(routes, function (route, path) {
    _.each(route, function (endpoint, method) {
      var ctrl = require('./controllers/' + endpoint.ctrl);
      if (!ctrl[endpoint.method]) {
        throw new Error(`method ${endpoint.method} not found in controller ${endpoint.ctrl}`);
      }
      const actions = [
//        function (req, res, next) {
//          setTimeout(next, 200);
//        },
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
      ];
      router[method](path, helper.autoWrapExpress(actions));
    });
  });
  app.use(path, router);
}


// cli api is JWT token based
var bearerMiddlewares = [
  function (req, res, next) {
    if (!req.headers.authorization) {
      return next();
    }
    passport.authenticate('bearer', { session: false })(req, res, next);
  }
];
// loadRouter("/cli-api", bearerMiddlewares, "./cli-api-routes.json");
loadRouter('/api', bearerMiddlewares, './api-routes.json');

app.use(function (req, res) {
  res.status(404);
  res.end('Not found');
});

app.use((err, req, res, next) => { // eslint-disable-line
  logger.logFullError(err, req.method, req.url);
  let status = err.httpStatus || 500;
  if (err.isJoi) {
    status = 400;
  }
  res.status(status);
  if (err.isJoi) {
    res.json({
      error: 'Validation failed',
      details: err.details
    });
  } else {
    res.json({
      error: err.message
    });
  }
});

co(function* () {
  var server = require('http').createServer(app);
  if (!sticky.listen(server, app.get('port'), {workers: config.WORKERS})) {
    winston.info('Express server listening on port %d in %s mode', app.get('port'), process.env.NODE_ENV);
  }
  yield SubmissionQueueService.init();
  require('./socket').startUp(server);
}).catch(e => {
  console.log(e);
  console.log(e.stack);
});
