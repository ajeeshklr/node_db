const fs = require('fs');
const path = require('path');

const CacheControl = {};

CacheControl.fetchTextFile = function (fileName, encoding, callback) {
    if (!(global.__cacheControl)) {
        global.__cacheControl = {};
    }

    if (global.__cacheControl[fileName]) {
        callback(null, global.__cacheControl[fileName]);
        return;
    }

    fs.readFile(fileName, encoding,
        function (err, str) {
            if (!err && str && str.length > 0) {

                global.__cacheControl[fileName] = str;
                callback(null, str);

            } else {
                callback("Error - Could not load the template file - " + fileName);
            }

        });


}

CacheControl.fetchRawFile = function (fileName, callback) {
    if (!(global.__cacheControl)) {
        global.__cacheControl = {};
    }

    if (global.__cacheControl[fileName]) {
        callback(null, global.__cacheControl[fileName]);
        return;
    }

    fs.readFile(fileName,
        function (err, data) {
            if (!err && data) {

                global.__cacheControl[fileName] = data;
                callback(null, data);

            } else {
                callback("Error - Could not load the template file - " + fileName);
            }

        });


}

module.exports = CacheControl;