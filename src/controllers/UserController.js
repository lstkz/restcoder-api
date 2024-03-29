'use strict';

const _ = require('underscore');
const multer = require('multer');
const helper = require('../common/helper');
const User = require('../models').User;
const NotFoundError = require('../common/errors').NotFoundError;
const BadRequestError = require('../common/errors').BadRequestError;
const ForumService = require('../services/ForumService');
const UserService = require('../services/UserService');
const SecurityService = require('../services/SecurityService');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage });

// Exports
module.exports = {
  getUser,
  getUsernameByForumUserId,
  updateUserInfo,
  removeUserPicture,
  changeEmail,
  updateUserPicture: [upload.single('picture'), updateUserPicture]
};

function* getUser(req, res) {
  const user = yield User.findOne({username_lowered: req.params.username.toLowerCase()});
  if (!user) {
    throw new NotFoundError('User not found');
  }
  const ret = _.pick(user.toJSON(), 'username', 'id', 'stats', 'createdAt', 'forumUserId', 'fullName', 'quote');
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

function* getUsernameByForumUserId(req, res) {
  const user = yield User.findOne({forumUserId: req.params.id});
  if (!user) {
    throw new NotFoundError('User not found');
  }
  res.json({
    username: user.username
  })
}


function* updateUserInfo(req, res) {
  yield UserService.updateUserInfo(req.user.id, req.body);
  res.json(yield UserService.getUserData(req.user.id));
}

function* updateUserPicture(req, res) {
  if (!req.file) {
    throw new BadRequestError('picture required');
  }
  yield UserService.updatePicture(req.user.id, req.file.originalname, req.file.path);

  res.json(yield UserService.getUserData(req.user.id));
}

function* removeUserPicture(req, res) {
  yield UserService.removePicture(req.user.id);

  res.json(yield UserService.getUserData(req.user.id));
}


function* changeEmail(req, res) {
  yield SecurityService.authenticate(req.user.username, req.body.password, 'Current password is invalid');
  yield UserService.changeEmail(req.user.id, req.body.email);

  res.json(yield UserService.getUserData(req.user.id));
}
