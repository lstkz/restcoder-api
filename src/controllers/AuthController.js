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
  changePassword,
  forgotPassword,
  resetPassword,
  resendActivationLink,
};

function* _createCookie(user, res) {
  const token = yield SecurityService.createBearerToken(user.id);
  const opts = { expires: new Date(Date.now() + ms(config.AUTH_COOKIE.EXPIRATION)), httpOnly: true };
  const payload = { token, forumUserId: user.forumUserId };
  const encoded = jwt.encode(payload, config.JWT_SECRET);
  res.cookie(config.AUTH_COOKIE.NAME, encoded, opts);
  return encoded;
}

function* register(req, res) {
  yield SecurityService.register(req.body);
  res.status(201).end();
}

function* login(req, res) {
  var user = yield SecurityService.authenticate(req.body.username, req.body.password);
  if (req.body.cookie) {
    const token = yield _createCookie(user, res);
    res.returnUser(user.id, token);
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
  const token = yield _createCookie(user, res);
  res.returnUser(user.id, token);
}


function* verifyNewEmail(req, res) {
  var user = yield UserService.verifyNewEmail(req.params.code);
  const token = yield _createCookie(user, res);
  res.returnUser(user.id, token);
}

function* changePassword(req, res) {
  yield SecurityService.authenticate(req.user.username, req.body.password, 'Current password is invalid');
  yield SecurityService.changePassword(req.user.id, req.body.newPassword);
  res.end();
}

function* forgotPassword(req, res) {
  yield SecurityService.forgotPassword(req.body.email);
  res.end();
}

function* resetPassword(req, res) {
  const user = yield SecurityService.resetPassword(req.body.password, req.body.code);
  res.returnUser(user.id);
}

function* resendActivationLink(req, res) {
  yield SecurityService.resendActivationLink(req.body.email);
  res.end();
}

