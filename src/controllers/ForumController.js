'use strict';

const config = require('config');
const request = require('superagent-bluebird-promise');

//Exports
module.exports = {
  getCategories,
  getCategory,
  getTopic,
};

function* _get(req, url) {
  const headers = {};
  if (req.headers.cookie) {
    headers.cookie = req.headers.cookie;
  }
  const ret = yield request
    .get(config.NODEBB_URL + url)
    .set(headers)
    .promise();
  return ret.body;
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* getCategories(req, res) {
  const { categories } = yield _get(req, '/api/categories');
  res.json(categories);
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* getCategory(req, res) {
  res.json(yield _get(req, '/api/category/' + req.params.id));
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* getTopic(req, res) {
  res.json(yield _get(req, '/api/topic/' + req.params.id));
}
