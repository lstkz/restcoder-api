'use strict';

const ms = require('ms');
const config = require('config');
const helper = require('../common/helper');
const SecurityService = require('../services/SecurityService');
const UserService = require('../services/UserService');
const jwt = require('jwt-simple');

// Exports
module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  verifyNewEmail,
};

function* _createCookie(user, res) {
  const token = yield SecurityService.createBearerToken(user.id);
  const opts = { expires: new Date(Date.now() + ms(config.AUTH_COOKIE.EXPIRATION)), httpOnly: true };
  const payload = { token, forumUserId: user.forumUserId };
  const encoded = jwt.encode(payload, config.JWT_SECRET);
  res.cookie(config.AUTH_COOKIE.NAME, encoded, opts);
  return token;
}

function* register(req, res) {
  yield SecurityService.register(req.body);
  res.status(201).end();
}

function* login(req, res) {
  var user = yield SecurityService.authenticate(req.body.username, req.body.password);
  if (req.body.cookie) {
    yield _createCookie(user, res);
    res.returnUser(user.id);
    return;
  }
  res.json({
    token: yield SecurityService.createBearerToken(user.id),
    user: yield UserService.getUserData(user.id),
  });
}

function* logout(req, res) {
  var opts = { expires: new Date(0), httpOnly: true };
  res.cookie(config.AUTH_COOKIE.NAME, "", opts);
  res.redirect('/home')
}

function* verifyEmail(req, res) {
  var user = yield SecurityService.verifyEmail(req.params.code);
  yield _createCookie(user, res);
  res.returnUser(user.id);
}


function* verifyNewEmail(req, res) {
  var user = yield UserService.verifyNewEmail(req.params.code);
  yield _createCookie(user, res);
  res.returnUser(user.id);
}

