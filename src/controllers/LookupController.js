'use strict';

const Service = require('../models').Service;

// Exports
module.exports = {
  getServices
};

function* getServices(req, res) {
  res.json(yield Service.find({}).select('_id description version envName'));
}
