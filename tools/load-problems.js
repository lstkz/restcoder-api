"use strict";

var fs = require('fs');
var _ = require("underscore");
var Path = require("path");
var utils = require("./utils");
var Problem = require("../src/models").Problem;


var basePath = Path.join(__dirname, "../data/problems");

utils.run(function* () {
    yield Problem.remove({});
    var directories = fs.readdirSync(basePath);
    yield directories.map(dir => {
        var path = basePath + "/" + dir;
        var data = JSON.parse(fs.readFileSync(path + "/data.json", 'utf8'));
        data.content = fs.readFileSync(path + "/content.md", 'utf8');
        return Problem.create(data);
    });
});