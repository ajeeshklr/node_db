'use strict';

// Use this class to execute specific tests.
// Tests can be of any nature. Add all specific tests to the test folder, the client will automatically pick up the test.
// At present, load testing is only possible with changes in the code.
// A configurable load testing can be provided later.

/**
 * This is the main class which validate all functionalities.
 */

const helpers = require('../lib/helpers');
let DBManager = require('../data/dbmanager').DbManager;
let co = require('co');
let config = require('../config').getConfig();

let container = {};
let modules = {};
helpers.loadModules("./test", modules, true, true); // Load all modules one by one.


let totalCount = 0;
let succeeded = 0;
let MAX_COUNT = 1000; // Use this for load testing the DB apis.

function _executeTest(modules, index, callback) {

    let mod = modules[index];

    (() => {
        let key = mod.key;
        // console.error("Executing test - " + key);
        mod.value((err, data) => {
            totalCount++;
            if (!err) {
                succeeded++;
                // console.log('\x1b[32m%s\x1b[0m%s', 'Test Pass - ', key);
            } else {
                // console.log('\x1b[31m%s\x1b[0m%s%s%s', 'Test FAILED - ', key, ' with error - ', err);
            }

            if (totalCount == MAX_COUNT * modules.length) {
                console.log('\x1b[32m%s\x1b[0m%s\x1b[32m%s\x1b[0m%s\x1b[31m%s\x1b[0m%s', 'Total tests executed - ', totalCount, ' PASS - ', succeeded, ' FAIL -', totalCount - succeeded);
                callback("Test completed for one set.")
                return; // No more execution
            }
            if (index < modules.length - 1) {
                _executeTest(modules, index + 1, callback);
            } else {
                _executeTest(modules, 0, callback);
            }
        });
    })();

};

function init() {

    console.log('BEGIN test execution.')

    let totalCount = 0;
    let succeeded = 0;

    // Get the Object's methods (functions):
    function getMethods(obj) {
        return Object.keys(obj)
            .filter((key) => typeof obj[key] === 'function')
            .map((key) => obj[key]);
    }

    let methods = getMethods(modules);

    co(function* () {
        var manager = DBManager.getInstance();
        let db = yield manager.configure(config);
        if (!db) {
            callback(new Error('Internal server error. Could not connect to DB driver.'));
            return;
        }

        let dbinstance = yield manager.openDatabase();
        console.log(dbinstance);
        var mod = null;

        if (methods.length > 0) {
            _executeTest(methods, 0, (s, f) => {
                console.log("test completed.");
            });
        }

    }).catch(err => {
        console.log(err);
    });
};

container.init = init;
module.exports = container;