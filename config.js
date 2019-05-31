/**
 * Configuration file for the application.
 */

const environments = {}



environments.staging = {
    'httpPort': 80,
    'httpsPort': 443,
    'envName': 'staging',
    'hashingSecret': 'this is a staging secret'
};

environments.production = {
    'httpPort': 5500,
    'httpsPort': 5501,
    'envName': 'production',
    'hashingSecret': 'this is a production secret'
};

environments.test = {
    'httpPort': 6000,
    'httpsPort': 6001,
    'envName': 'test',
    'hashingSecret': 'this is a testing secret'
};

environments.mysql = {
    'httpPort': 6000,
    'httpsPort': 6001,
    'envName': 'mysql',
    'hashingSecret': 'this is a testing secret'
};

environments.sqlite_cipher = {
    'httpPort': 6000,
    'httpsPort': 6001,
    'envName': 'sqlite_cipher'
};


let currentEnv = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
let environmentToExport = null;

// Load all config from app.json here.

(() => {

    try {
        var appConfig = null;
        if (global.appConfig) {
            appConfig = global.appConfig;
        } else {
            var fs = require('fs');
            var data = fs.readFileSync('app.json', 'utf8');
            appConfig = JSON.parse(data);
            global.appConfig = appConfig;
        }
        if (appConfig.defaults.env != currentEnv && currentEnv == '') {
            currentEnv = appConfig.defaults.env;
        }

        if (typeof (environments[currentEnv]) != "object") {
            console.error("Invalid environment information passed. Please pass %s or %s or %s or %s", ["staging", "production", "test", "provide valid env in the app.json defaluts config."]);
            throw (new Error("Invalid configuration received."));
        }

        environmentToExport = environments[currentEnv];
        environmentToExport.appConfig = appConfig;

        environmentToExport.getAppConfig = function () {
            return environmentToExport.appConfig;
        }

        environmentToExport.getStoreConfig = function () {
            return environmentToExport.appConfig.stores;
        };

        environmentToExport.getModelConfig = function () {
            return environmentToExport.appConfig.models;
        };

        environmentToExport.getConfig = function () {
            return environmentToExport.appConfig.config[currentEnv];
        }

        environmentToExport.getDatabaseConfig = function () {
            return environmentToExport.getConfig().database;
        };

        console.log(environmentToExport.getModelConfig());
        console.log(environmentToExport.getStoreConfig());
        console.log(environmentToExport.getDatabaseConfig());

    } catch (err) {
        console.error(err);

    }
})();

module.exports = environmentToExport;