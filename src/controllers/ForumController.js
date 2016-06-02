'use strict';

const config = require('config');
const _ = require('underscore');
const request = require('superagent-bluebird-promise');
const logger = require('../common/logger');
const jwt = require('jwt-simple');
const ADMIN_ID = 1;

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
  getUnreadTotal,
  getUnread,
  markAllAsRead,
  changeWatching,
  watchCategory,
  unwatchCategory,
  getUserPosts,
};


request.Request.prototype.completeNodeBB = function* (errorMsg) {
  const {body} = yield this.promise();
  if (body.code !== 'ok') {
    logger.error(errorMsg, body);
    throw new Error(errorMsg);
  }
  return body.payload;
};

function _createCookie(forumUserId) {
  const payload = { forumUserId };
  return `${config.AUTH_COOKIE.NAME}=${jwt.encode(payload, config.JWT_SECRET)}`;
}

function* _get(req, url, query, forceForumUserID) {
  const headers = {};
  if (forceForumUserID) {
    headers.cookie = _createCookie(forceForumUserID);
  } else if (req.headers.cookie) {
    headers.cookie = req.headers.cookie;
  }
  const ret = yield request
    .get(config.NODEBB_URL + url)
    .query(query || {})
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
function* getUnreadTotal(req, res) {
  res.json({
    count: yield _get(req, '/api/unread/total')
  });
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* getUnread(req, res) {
  let url = '/api/unread';
  if (req.params.type === 'new' || req.params.type === 'watched') {
    url += '/' + req.params.type;
  }
  res.json(yield _get(req, url, _.pick(req.query, 'cid', 'page')));
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
function* getUserPosts(req, res) {
  res.json(yield _get(req, `/api/user/${req.params.username}/posts` + _appendPageQuery(req), null, ADMIN_ID));
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
function* markAllAsRead(req, res) {
  yield request
    .post(config.NODEBB_URL + '/api/mark-read')
    .set({
      cookie: req.headers.cookie
    })
    .promise();
  res.end();
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* changeWatching(req, res) {
  yield request
    .post(config.NODEBB_URL + `/api/topic/${req.params.id}/watch`)
    .set({
      cookie: req.headers.cookie
    })
    .send(req.body)
    .promise();
  res.end();
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* watchCategory(req, res) {
  yield request
    .post(config.NODEBB_URL + `/api/category/${req.params.id}/watch`)
    .set({
      cookie: req.headers.cookie
    })
    .send(req.body)
    .promise();
  res.end();
}

/**
 * @param {Object} req the request
 * @param {Object} res the response
 */
function* unwatchCategory(req, res) {
  yield request
    .delete(config.NODEBB_URL + `/api/category/${req.params.id}/watch`)
    .set({
      cookie: req.headers.cookie
    })
    .send(req.body)
    .promise();
  res.end();
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
