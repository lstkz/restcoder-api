'use strict';

const gravatar = require('gravatar');
const helper = require('../common/helper');
const validate = require('../common/validator').validate;
const User = require('../models').User;

// Exports
module.exports = {
  getRanking: helper.wrapExpress(getRanking)
};

function* getRanking(req, res) {
  var limit = Number(req.query.limit || 10);
  var offset = Number(req.query.offset || 0);
  var language = req.query.language;
  validate({ limit, offset, language }, {
    limit: { type: 'Integer', min: 1, max: 100 },
    offset: { type: 'Integer', min: 0 },
    language: { type: 'enum', 'enum': ['nodejs', 'ruby', 'python', 'go', 'java'], required: false }
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
  var users = yield User
        .find(criteria)
        .sort(sort)
        .skip(offset)
        .limit(limit);
  users = yield users.map(u => function* () {
    var user = {
      id: u.id,
      username: u.username
    };
    if (!language) {
      user.score = u.stats.score;
    } else {
      user.score = u.stats.languages[language];
    }
    user.image = gravatar.url(u.email, { d: 'identicon', s: 35 });
    var rankCriteria = {};
    if (language) {
      rankCriteria['stats.languages.' + language] = { $gt: user.score };
    } else {
      rankCriteria['stats.score'] = { $gt: user.score };
    }
    var count = yield User.count(rankCriteria);
    user.rank = count + 1;
    return user;
  });
  res.json(users);
}
