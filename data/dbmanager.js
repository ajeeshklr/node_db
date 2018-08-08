"use strict";

/**
 * This file holds all DB operations related functionalities.
 * All DB operations are handled here.
 * For ease of development, a simple DB manager is created here.
 * This class shall contain only generic functionalities.
 * Basically, this would be a framework for handling CRUD functionalities.
 */



let DBFactory = require('./factory/dbfactory').DBFactory;
let AbstractDB = require('./factory/abstractdb').AbstractDB;
let IDBRecord = require('./factory/idbrecord').IDBRecord;

let _singletonInstance = null;

let DbManager = class DbManager {

    constructor() {
        if (!DbManager._init) {
            throw new Error("Instance of singleton can't be created.");
        }
        
        console.log('Instantiating DB manager. !!!');
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

        let p = new Promise((resolve, reject) => {

            if (null == config) {
                reject(new Error('Invalid configuration passed on to DB manager configure function.'));
                return;
            }

            DBFactory.getInstnace().getDatabase(config)
                .then(db => {
                    this.database = db;
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
        let p = new Promise((resolve, reject) => {
            if (null == this.database) {
                reject({ 'Error Code': 400, 'Error Text': 'Database is not configured. Call configure to configure database.' });
            } else {
                this.database.open()
                    .then(res => {
                       // console.log(res);
                        resolve(this.database);
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

        let p = new Promise((resolve, reject) => {
            if (null == this.database) {
                reject('Database is null or not initialized yet.!!');
            } else {
                this.database.closeDatabase()
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

        let p = new Promise((resolve, reject) => {
            if (this.database != null) {
                this.database.dispose()
                    .then(res => {
                        this.database = null;
                        resolve(err, res);
                    }).catch(err => {
                        reject(err);
                    });
            } else {
                reject({ 'Error': 400, 'Error Text': 'Invalid database.' });
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
            _singletonInstance = new DbManager();  // This shall not create any issues now.
            DbManager._init = false;
        }

        return _singletonInstance;
    };

    /**
     * Execute DB operation on the DB underlying.
     */
    execute(dboperation, callback) {

        if (!this.database) {
            if (callback) {
                callback(400, 'Invalid database or database is not initialized.');
            } else {
                return new Promise((resolve, reject) => {
                    reject('Invalid database or databse is not initialized.');
                });
            }
        } else {
            if (this.database.state != AbstractDB.DB_STATES.DB_INVALID) {
                if (callback) {
                    this.database.execute(dboperation, callback);
                } else {
                    return new Promise((resolve, reject) => {
                        this.database.execute(dboperation)
                            .then(res => {
                                resolve(res);
                            }).catch(err => {
                                reject(err);
                            });
                    }); // return new Promise
                } // else 
            } // this.database.state != AbstractDB.DB_STATES.DB_INVALID
        } // else
    };  // execute

    getDatabase() {
        return this.database;
    }

};

exports.DbManager = DbManager;
