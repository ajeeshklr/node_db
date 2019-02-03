"use strict";

/**
 * This file holds all DB operations related functionalities.
 * All DB operations are handled here.
 * For ease of development, a simple DB manager is created here.
 * This class shall contain only generic functionalities.
 * Basically, this would be a framework for handling CRUD functionalities.
 */



let DBFactory = require('../core/factory/dbfactory').DBFactory;

let _singletonInstance = null;

let DbManager = class DbManager {

    constructor() {
        if (!DbManager._init) {
            throw new Error("Instance of singleton can't be created.");
        }

        console.error('Instantiating DB manager. !!!');
    };

    /**
     * 
     * Configure DBmanager using the configuration.
     * Configuration shall mention details regarding the DB and drivers to use.
     * 
     * Some of the configuration information shall be supplied to the factory to create appropriate DB.
     * 
     * @param {object} config Configuration parameter to perform DB config.
     * @param {function} callback Callback function once the configuration is successfull.
     * @returns {Promise} is no callback is specified. @returns {void} otherwise.
     */
    configure(config, callback) {

        var _this = this;
        let p = new Promise((resolve, reject) => {

            if (null == config) {
                reject(new Error('Invalid configuration passed on to DB manager configure function.'));
                return;
            }

            DBFactory.getInstnace().getDatabase(config)
                .then(db => {
                    _this.database = db;
                    resolve(db);
                }).catch(err => {
                    reject(err);
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

    openDatabase(callback) {
        var _this = this;

        let p = new Promise((resolve, reject) => {
            if (null == _this.database) {
                reject({
                    'Error Code': 400,
                    'Error Text': 'Database is not configured. Call configure to configure database.'
                });
            } else {
                _this.database.open()
                    .then(res => {
                        // console.log(res);
                        resolve(_this.database);
                    }).catch(err => {
                        reject(err);
                    })
            }

        });

        if (callback) {
            p.then(res => {
                callback(null, this.database);
            }).catch(err => {
                callback(err);
            });
        } else {
            return p;
        }
    };


    closeDatabase(callback) {

        var _this = this;

        let p = new Promise((resolve, reject) => {
            if (null == _this.database) {
                reject('Database is null or not initialized yet.!!');
            } else {
                _this.database.closeDatabase()
                    .then(res => {
                        resolve(res);
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

    disposeDatabase(callback) {
        var _this = this;

        let p = new Promise((resolve, reject) => {
            if (_this.database != null) {
                _this.database.dispose()
                    .then(res => {
                        _this.database = null;
                        resolve(err, res);
                    }).catch(err => {
                        reject(err);
                    });
            } else {
                reject({
                    'Error': 400,
                    'Error Text': 'Invalid database.'
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

    static getInstance() {
        if (null == _singletonInstance) {
            DbManager._init = true; // A crude way to initialize DBManager singleton.
            _singletonInstance = new DbManager(); // This shall not create any issues now.
            DbManager._init = false;
        }

        return _singletonInstance;
    };


    getDatabase() {
        return this.database;
    }

};

exports.DbManager = DbManager;