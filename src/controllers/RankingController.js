'use strict';

const gravatar = require('gravatar');
const _ = require('underscore');
const helper = require('../common/helper');
const validate = require('../common/validator').validate;
const User = require('../models').User;
const ForumService = require('../services/ForumService');

// Exports
module.exports = {
  getRanking,
  getRankingFilter
};

function* getRanking(req, res) {
  var limit = Number(req.query.limit || 10);
  var offset = Number(req.query.offset || 0);
  var language = req.query.language;
  validate({ limit, offset, language }, {
    limit: { type: 'Integer', min: 1, max: 100 },
    offset: { type: 'Integer', min: 0 },
    language: { type: 'enum', 'enum': ['nodejs', 'ruby', 'python', 'go', 'java', 'dotnet'], required: false }
  });
  var sort;
  var criteria = {};
  if (language) {
    sort = '-stats.languages.' + language;
    criteria['stats.languages.' + language] = { $gt : 0 };
  } else {
    sort = '-stats.score';
    criteria['stats.score'] = { $gt : 0 };
  }
  const total = yield User.count(criteria);
  var users = yield User
        .find(criteria)
        .sort(sort)
        .skip(offset)
        .limit(limit);
  users = yield users.map(u => function* () {
    var user = {
      id: u.id,
      username: u.username,
      stats: u.stats
    };
    if (!language) {
      user.score = u.stats.score;
    } else {
      user.score = u.stats.languages[language];
    }
    var rankCriteria = {};
    if (language) {
      rankCriteria['stats.languages.' + language] = { $gt: user.score };
    } else {
      rankCriteria['stats.score'] = { $gt: user.score };
    }
    var count = yield User.count(rankCriteria);
    user.rank = count + 1;
    const forumUser = yield ForumService.getUserProfile(u.forumUserId);
    user.picture = forumUser.picture;
    user.icon ={
      text: forumUser['icon:text'],
      bgColor: forumUser['icon:bgColor'],
    };
    return user;
  });
  res.json({
    total,
    items: users
  });
}


function* getRankingFilter(req, res) {
  const languages = ['nodejs', 'ruby', 'python', 'java', 'dotnet'];
  const promises = {
    any: User.count({'stats.score': { $gt: 0}})
  };
  languages.forEach((lang) => {
    promises[lang] = User.count({
      ['stats.languages.' + lang]: { $gt : 0 }
    });
  });
  const result = yield promises;
  const filter = [
    {name: 'language', items: _.map(result, (count, name) => ({name, count}))}
  ];
  filter[0].items.sort((a, b) => b.count - a.count);
  res.json(filter);
}
