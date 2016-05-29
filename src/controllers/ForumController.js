'use strict';

const config = require('config');
const request = require('superagent-bluebird-promise');
const logger = require('../common/logger');

//Exports
module.exports = {
  getCategories,
  getCategory,
  getTopic,
  createTopic,
  getRawPost,
  createPost,
  updatePost,
  getPostRedirect,
};


request.Request.prototype.completeNodeBB = function* (errorMsg) {
  const {body} = yield this.promise();
  if (body.code !== 'ok') {
    logger.error(errorMsg, body);
    throw new Error(errorMsg);
  }
  return body.payload;
};

function* _get(req, url) {
  const headers = {};
  if (req.headers.cookie) {
    headers.cookie = req.headers.cookie;
  }
  const ret = yield request
    .get(config.NODEBB_URL + url)
    .set(headers)
    .redirects(0)
    .promise();
  return ret.body;
}

function _appendPageQuery(req) {
  return '?page=' + (req.query.page || '1');
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
  res.json(yield _get(req, '/api/category/' + req.params.id + _appendPageQuery(req)));
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* getTopic(req, res) {
  res.json(yield _get(req, '/api/topic/' + req.params.id + _appendPageQuery(req)));
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* getRawPost(req, res) {
  res.json(yield _get(req, '/api/raw-post/' + req.params.id));
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* getPostRedirect(req, res) {
  let url;
  try {
    url = yield _get(req, '/api/post/' + req.params.id)
  } catch (e) {
    if (e.originalError && e.originalError.response) {
      url = e.originalError.response.body;
    } else {
      throw e;
    }
  }
  const result = yield _get(req, '/api' + url);
  let targetUrl = '/topic/' + result.slug;
  if (result.pagination.currentPage > 1) {
    targetUrl += '?page=' + result.pagination.currentPage;
  }
  res.json({url: targetUrl});
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* createTopic(req, res) {
  const body = yield request
    .post(config.NODEBB_URL + '/api/v1/topics')
    .set({
      authorization: `Bearer ${config.NODEBB_MASTER_TOKEN}`
    })
    .send({
      _uid: req.user.forumUserId,
      cid: req.body.cid,
      title: req.body.title,
      content: req.body.content,
    })
    .completeNodeBB('Cannot create topic');
  res.json(body);
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* createPost(req, res) {
  const body = yield request
    .post(config.NODEBB_URL + '/api/v1/topics/' + req.params.id)
    .set({
      authorization: `Bearer ${config.NODEBB_MASTER_TOKEN}`
    })
    .send({
      _uid: req.user.forumUserId,
      content: req.body.content,
    })
    .completeNodeBB('Cannot create post');
  res.json(body);
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* updatePost(req, res) {
  const body = yield request
    .put(config.NODEBB_URL + '/api/v1/topics/' + req.params.id)
    .set({
      authorization: `Bearer ${config.NODEBB_MASTER_TOKEN}`
    })
    .send({
      _uid: req.user.forumUserId,
      pid: req.body.pid,
      content: req.body.content,
      title: req.body.title,
    })
    .completeNodeBB('Cannot update post');
  res.json(body);
}
