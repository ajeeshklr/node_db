/**
 * Configuration file for the application.
 */

const environments = {}

environments.staging = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'staging',
    'hashingSecret': 'this is a staging secret',
    'templateGlobals': {
        'appName': 'MeshChat - Admin Page.',
        'companyName': 'iMeshConnect Solutions Private Ltd.',
        'yearCreated': '2018'
    }
};

environments.production = {
    'httpPort': 5500,
    'httpsPort': 5501,
    'envName': 'production',
    'hashingSecret': 'this is a production secret',
    'templateGlobals': {
        'appName': 'MeshChat - Admin Page.',
        'companyName': 'iMeshConnect Solutions Private Ltd.',
        'yearCreated': '2018'
    }
};

environments.test = {
    'httpPort': 6000,
    'httpsPort': 6001,
    'envName': 'test',
    'hashingSecret': 'this is a testing secret',
    'templateGlobals': {
        'appName': 'MeshChat - Admin Page.',
        'companyName': 'iMeshConnect Solutions Private Ltd.',
        'yearCreated': '2018'
    }
};

environments.mysql = {
    'httpPort': 6000,
    'httpsPort': 6001,
    'envName': 'test',
    'hashingSecret': 'this is a testing secret',
    'templateGlobals': {
        'appName': 'MeshChat - Admin Page.',
        'companyName': 'iMeshConnect Solutions Private Ltd.',
        'yearCreated': '2018'
    }
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
        console.log(err);

    }
})();

module.exports = environmentToExport;