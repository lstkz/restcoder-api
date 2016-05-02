'use strict';

const helper = require('../common/helper');
const CodeTemplate = require('../models').CodeTemplate;

// Exports
module.exports = {
  getCodeTemplate: helper.wrapExpress(getCodeTemplate)
};


function* getCodeTemplate(req, res) {
  var codeTemplate = yield CodeTemplate.findByIdOrError(req.params.language + '_base');
  res.json(codeTemplate);
}

