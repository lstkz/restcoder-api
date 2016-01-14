"use strict";

var Path = require("path");

module.exports = {
    "WEB_SERVER_PORT": 3500,
    "LOG_LEVEL": "debug",
    "MONGODB_URL": "mongodb://127.0.0.1:27017/restcoder",
    "STORAGE_PATH": Path.join(__dirname, "../uploads"),
    "SUBMISSION_MAX_SIZE": 5 * 1024 * 1024,
    "SUBMISSION_DOWNLOAD_URL": "http://192.168.0.21:3500/uploads/",
    "SECURITY": {
        "SALT_LENGTH": 64,
        "ITERATIONS": 4096,
        "PASSWORD_LENGTH": 64
    },
    "JWT_SECRET": "d9d902nfdbncbvaladm1f",
    "SESSION_SECRET": "dkvnvndkjdituworgbcs"
};