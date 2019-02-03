"use strict";

let co = require('co');

/**
 * A factory to create DBs and its corresponding handlers.
 */


/// A singleton variable used with the factory.
let _singletonInstance = null;
let _dbInstnace = null;

let DBFactory = class DBFactory {

    constructor() {
        if (!DBFactory._init) {
            throw new Error("Instance of singleton can't be created.");
        }

        console.error('Instantiating DB factory instance.');
    };

    static getInstnace() {

        if (null == _singletonInstance) {
            DBFactory._init = true;
            _singletonInstance = new DBFactory();
            DBFactory._init = false;
        }

        return _singletonInstance;
    };

    /**
     * Create database instance based on the configuration received in the config property of the DB manager.
     * {AbstractDB} config Config details received from DbManager.
     */
    getDatabase(config, callback) {

        let p = new Promise((resolve, reject) => {

            let currentConfig = this.config;
            let currentDb = this._dbInstnace;

            if (null != this._dbInstnace) {
                if (config.database.type != null &&
                    typeof (config.database.type) == 'string') {
                    // Both types are same.
                    if (currentConfig.database.type != config.database.type) { // Check if the request to generate DB is for the same type.
                        // TODO - Dispose the old DB and re-init with new instance.
                        // TODO - Use the promise implementation.
                        currentDb.dispose()
                            .then(res => {
                                this.createDB(config)
                                    .then(res => {
                                        this._dbInstnace = res;
                                        resolve(res);
                                    }).catch(err => {
                                        this._dbInstnace = null;
                                        reject(err);
                                    });
                            }).catch(err => {
                                reject(err);
                            });
                    } else {
                        resolve(currentDb);
                    }
                } else {
                    reject('Invalid configuration specified.');
                }
            } else {
                this.createDB(config)
                    .then(db => {
                        this._dbInstnace = db;
                        resolve(db); // Resolved with new DB returned.
                    }).catch(err => {
                        reject(err);
                    });
            }
        });

        if (callback) {
            p.then(res => {
                callback(null, res);
            }).catch(err => {
                callback(err);
            });
        } else {
            return p;
        }

    };


    /**
     * 
     * @param {JSON} config Config object for the database. This is configured in the config.js file in app directory.
     * @param {function} callback Callback to receive notifications once DB is created.
     * @returns {Promise} Returns Promise object if callback specified is not valid, @returns {void} otherwise.
     */
    createDB(config, callback) {

        let p = new Promise((resolve, reject) => {

            let path = config.database.path + config.database.db + ".js";

            let path_resolve = require('path');

            let processPath = process.cwd(); // Current working path of the node.js process.
            let dbpath = path_resolve.resolve(processPath, path);

            let db = require(dbpath).DB;
            let dbinstance = new db();


            console.log('Creating new DB instance from ' + path);

            dbinstance.init(config.database)
                .then((res) => {
                    if (res) {
                        this.config = config;
                        resolve(dbinstance);
                    } else {
                        reject('Could not initialize database.');
                    }
                }).catch((err) => {
                    console.log(err);
                    reject('Database initialization failed.');
                });
        });
        if (callback) {
            p.then(res => {
                callback(null, res);
            }).catch(err => {
                callback(err);
            });
        } else {
            return p;
        }
    };

};

exports.DBFactory = DBFactory; // Module export, so that this can be exported and used else where.