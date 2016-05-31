'use strict';

const _ = require('underscore');
const gravatar = require('gravatar');
const helper = require('../common/helper');
const User = require('../models').User;
const NotFoundError = require('../common/errors').NotFoundError;
const ForumService = require('../services/ForumService');

// Exports
module.exports = {
  getUser
};

function* getUser(req, res) {
  const user = yield User.findOne({username_lowered: req.params.username});
  if (!user) {
    throw new NotFoundError('User not found');
  }
  const ret = _.pick(user.toJSON(), 'username', 'id', 'stats', 'createdAt', 'forumUserId');
  ret.image = gravatar.url(user.email, { d: 'identicon', s: 135 });
  if (user.stats.score) {
    var count = yield User.count({'stats.score': { $gt: user.stats.score }});
    ret.rank = count + 1;
  } else {
    ret.rank = 'N/A';
  }
  const forumUser = yield ForumService.getUserProfile(user.forumUserId);
  ret.picture = forumUser.picture;
  ret.postCount = forumUser.postcount;
  ret.icon ={
    text: forumUser['icon:text'],
    bgColor: forumUser['icon:bgColor'],
  };
  res.json(ret)
}
