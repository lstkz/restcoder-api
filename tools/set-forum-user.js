"use strict";

const username = 'sky';
const forumUserId = 1;

const User = require('../src/models').User;
var utils = require("./utils");

utils.run(function* () {
  const user = yield User.findOne({username_lowered: username});
  user.forumUserId = forumUserId;
  yield user.save();
  process.exit();
});
