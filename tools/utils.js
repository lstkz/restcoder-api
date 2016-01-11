"use strict";

var fs = require('fs');
var co = require("co");

function getFiles(dir, currentFiles){
    currentFiles = currentFiles || [];
    var files = fs.readdirSync(dir);
    files.forEach(fileName => {
        var name = dir + '/' + fileName;
        if (fs.statSync(name).isDirectory()){
            getFiles(name, currentFiles);
        } else {
            currentFiles.push(name);
        }
    });
    return currentFiles;
}

function run(fn) {
    co(fn)
        .then(() => {
            console.log("\nDONE");
            process.exit();
        })
        .catch(e => {
        console.log(e.stack);
        process.exit();
    });
}

module.exports = {
    getFiles,
    run
};