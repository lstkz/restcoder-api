"use strict";

var utils = require("./utils");
var ScoringService = require("../src/services/ScoringService");

utils.run(function* () {
    console.log("recalculating stats", new Date());
    yield ScoringService.recalculateStats();
    console.log("done", new Date());
    process.exit();
});