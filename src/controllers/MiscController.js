'use strict';

const MiscService = require('../services/MiscService');

// Exports
module.exports = {
  contact,
};

function* contact(req, res) {
  const values = req.body || {};
  if (req.user) {
    values.userId = req.user.id;
  }
  yield MiscService.contact(req.body);
  res.status(201).end();
}

