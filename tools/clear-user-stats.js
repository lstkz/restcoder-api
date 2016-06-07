"use strict";
const utils = require("./utils");
const ScoringService = require('../src/services/ScoringService');

const username = "sky";

utils.run(function* () {
  yield ScoringService.clearStats(username);
  process.exit();
});
