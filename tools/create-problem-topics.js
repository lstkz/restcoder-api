"use strict";
const utils = require("./utils");
const config = require('config');
const request = require('superagent-bluebird-promise');
const Problem = require('../src/models').Problem;

utils.run(function* () {
  const problems = yield Problem.find({forumTopicUrl: {$exists: false}});
  yield problems.map((problem) => function* () {
    try {
      const {body} = yield request
        .post(config.NODEBB_URL + '/api/v1/topics')
        .set({
          authorization: `Bearer ${config.NODEBB_BOT_TOKEN}`
        })
        .send({
          cid: config.NODEBB_PROBLEMS_CID,
          title: problem.name,
          content: 'Problem discussion',
        })
        .promise();
      problem.forumTopicUrl = '/topic/' + body.payload.topicData.slug;
      yield problem.save();
    } catch (e) {
      console.log(problem.id, e.stack || e);
    }
  });
  process.exit();
});
