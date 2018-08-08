"use strict";

/**
 * 
 * This is the implementation for an abstract DB class.
 * This class shall take care of all basic CRUD operations.
 * A concrete implementation of this shall be provided separately for different DB implementations.
 * DB factory shall output this DB instance.
 * 
 */
let IDBRecord = require('./idbrecord').IDBRecord;
let DBOperation = require('./dboperation').DBOperation;
let AbstractModel = require('./model/abstractmodel').AbstractModel;
let DBOP = require('./dboperation').DB_OP;


/**
 * Supported enumerations for DB state.
 * Open - DB_OPEN
 * Close - DB_CLOSE
 * Uninitialized - DB_INVALID
 * Initialized - DB_INIT
 * 
 * */
const DB_STATES = {
    DB_INVALID: 0,
    DB_INIT: 1,
    DB_OPEN: 2,
    DB_CLOSE: 3
};

const TRANSACTION_STATES = {
    STATE_INVALID: -1,
    STATE_BEGIN: 0,
    STATE_END_COMMIT_PENDING: 1,
    STATE_ENDED: 2,
    STATE_COMMIT_IN_PROGRESS: 3,
};

let AbstractDB = class AbstractDB {
    /**
     * 
     * Abstract DB supports the following operations.
     * 1. open - open existing db or create new db. Returns true if opened successfully otherwise false.
     * 2. close - close the opened db connection.
     * 3. create - create new records
     * 4. read - read record(s)
     * 5. update - update existing record(s) // If supports bulk operations.
     * 6. delete - delete existing record(s).
     * 7. compaction - in addition to the basic operations, db compaction is one another operation an abstract db can perform.
     * 
     */


    // Default constructor for DB.
    constructor() {

        this.state = DB_STATES.DB_INVALID; // Initial state, set to invalid.
        this.transactionalModel = false;
        this._isDirty = false;
        this._clientdb = null; // No client DB created/opened initially.
    };

    /**
     * This API is used to initialize the databse which is under use.
     * @param {Object} config Initialize database. This will either return a promise or accepts a callback.
     * @param {function} callback A callback function, if callback mechanism is used in the client application.
     * @returns void, if callback is used otherwise returns {Promise}
     */
    init(config, callback) {

        let p = new Promise((resolve, reject) => {

            if (null == config) {
                reject({
                    'Error': 400,
                    'Error Text:': 'Invalid configuration passed on to MongoClient.'
                });
                return;
            }

            this.__initInternal(config)
                .then(res => {
                    this.state = DB_STATES.DB_INIT;
                    this.config = config; // Pass the config to the class, so that it can be used later.
                    resolve(res);
                }).catch(err => {
                    console.log(err);
                    reject(err);
                });
        });

        // Callback with status and details. 
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

    __initInternal(config) {
        return new Promise((resolve, reject) => {
            reject('API is not overriden in derived class.');
        });
    }

    /**
     * Use this API to open the DB instance. It is required to call this API prior executing any operations on the DB.
     * @param {function} callback A callback to receive the DB instance, if opened.
     * @returns {Promise} Returns a promise object if the callback passed is null or not defined.
     */
    open(callback) {
        let p = new Promise((resolve, reject) => {

            if (this.state == DB_STATES.DB_OPEN) {
                // console.log('Db is already open. Sending existing db instance back.!');
                resolve(this._clientdb); // DB is already open.

                return;
            }

            if (null == this.config) {
                reject(new Error("There is error in updating configuration."));
            }

            // Shall be overriden by derived class.
            this.__openInternal()
                .then(res => {
                    this.state = DB_STATES.DB_OPEN;
                    this._clientdb = res;
                    this.databaseName = this.config.name;
                    resolve(res);
                }).catch(err => {
                    reject(err);
                });
        });

        if (callback) {
            p.then(res => {
                callback(null, res);
            }).catch(err => {
                callback(err);
            })
        } else {
            return p;
        }
    }

    /**
     * This API shall be overriden by derived classes.
     */
    __openInternal() {
        return new Promise((_, reject) => {
            reject({
                'Error': 400,
                'Error Text': 'Database can\'t be opened or this function is not implemented in derived classes.'
            });
        })
    };

    /**
     * Close the database gracefully. 
     * Any pending commits will be performed before closing DB instance.
     * @returns {Promise} Returns promise object
     */
    closeDatabase() {
        let p = new Promise((resolve, reject) => {
            if (this.state == DB_STATES.DB_OPEN) {
                this.commit();

                this.__closeInternal()
                    .then(res => {
                        this.state = DB_STATES.DB_CLOSE;
                        resolve(res);
                    }).catch(err => {
                        reject({
                            'Error': 400,
                            'Error Text': 'Error closing database.'
                        });
                    });
            } else {
                reject('DB is not open.');
            }
        });

        if (callback) {
            p.then(res => {
                callback(null, res);
            }).catch(err => {
                callback(err);
            })
        } else {
            return p;
        }
    }

    isConnected() {
        return false;
    }

    /**
     * This API shall be overriden by derived class inorder to achieve the desired result.
     * Call to baseclass method is mandatory as it changes status of the DB and commits are getting called.
     * When overriden in derived class, call to this base class method shall be made without callback function.
     * @param {function} callback Callback to indicate operation status async.
     */
    __closeInternal() {
        return new Promise((resolve, reject) => {
            reject({
                'Error': 400,
                'Error Text': 'Function is not implemented in derived class or this base class method is called with callback function.'
            })
        });
    };

    /**
     * This API shall be used to dispose the DB instance.
     * All call to this DB instance will fail once this API is executed.
     * Client shall not perform any other DB operations after this API is invoked.
     * @param {function} callback A callback function to receive API results.
     * @returns {Promise} Returns promise, if the callback passed to this function is null. @returns {void} otherwise
     */
    dispose(callback) {

        let p = new Promise((resolve, reject) => {
            if (this.state != DB_STATES.DB_INVALID) {

                this.__disposeInternal()
                    .then(res => {
                        _this.state = DB_STATES.DB_INVALID; // Change the internal DB state to invalid state.

                        resolve(res);
                    }).catch(err => {
                        reject(err);
                    });

            } else {
                reject("Database is not open or underlying driver is not initialized.");
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

    /// Internal function, which can be overridden by derived classes.
    // Use this API to perform begin transaction, for a transactional model.
    __performBeginTransaction() {

    };

    /// API to perform END transaction.
    /// This can be overridden by derived classes.
    __performEndTransaction() {

    };

    /// Internal method, which can be overridden by derived classes.
    /// Code for performing commit operations are placed here.
    __performCommit() {

    };

    // Dispose method, which shall be overridden by derived classes.
    // Any call to this function is mandatory.
    __disposeInternal() {

        return new Promise((resolve, reject) => {
            this.closeDatabase()
                .then(res => {
                    resolve(res);
                }).catch(err => {
                    console.log('\x1b[31m%s\x1b[0m%s-%s', 'Error - closeDatabase ', err, data);
                    console.log('Failed to close the database when dispose is called.');
                    reject(err);
                });
        });
    };

    beginTransaction() {
        if (this.transactionalModel) {
            if (this._transaction_state != TRANSACTION_STATES.STATE_BEGIN) {
                this._transaction_state = TRANSACTION_STATES.STATE_BEGIN;
                this.__performBeginTransaction();
            }
        }
    };

    endTransaction() {
        if (this.transactionalModel) {
            if (this._transaction_state != TRANSACTION_STATES.STATE_INVALID && this._transaction_state != TRANSACTION_STATES.STATE_ENDED) {
                this.__performEndTransaction();
                if (this._isDirty) {
                    this._transaction_state = TRANSACTION_STATES.STATE_END_COMMIT_PENDING;
                } else {
                    this._transaction_state = TRANSACTION_STATES.STATE_ENDED;
                }
            }
        }
    };

    commit() {
        if (this.transactionalModel) {
            if (this._transaction_state = TRANSACTION_STATES.STATE_END_COMMIT_PENDING) {
                this._transaction_state = TRANSACTION_STATES.STATE_COMMIT_IN_PROGRESS;
                this.__performCommit();
                this._isDirty = false;

                this._transaction_state = TRANSACTION_STATES.STATE_INVALID; // 
            }
        }
    };

    execute(dboperation, callback) {

        if (null == dboperation ||
            null == dboperation.model) {
            console.log(dboperation);
            if (callback) {
                callback(400, 'Invalid parameters received.');
                return;
            } else {
                return new Promise((resolve, reject) => {
                    reject('Invalid parameters recived.');
                });
            }
        }

        if (this.state != AbstractDB.DB_STATES.DB_OPEN || null == this._clientdb) {
            if (callback) {
                callback(500, 'Database is not open or databse is not initialized.');
                return;
            } else {
                return new Promise((resolve, reject) => {
                    reject('IDatabase is not open or databse is not initialized.');
                });
            }
        }

        let func = null;

        switch (dboperation.operation) {
            case DBOP.DB_OP_INSERT:
                func = this.insert(dboperation.model, callback);
                break;
            case DBOP.DB_OP_DELETE:
                func = this.delete(dboperation.model, callback);
                break;
            case DBOP.DB_OP_READ:
                func = this.read(dboperation.model, callback);
                break;
            case DBOP.DB_OP_UPDATE:
                func = this.update(dboperation.model, callback);
                break;
            case DBOP.DB_OP_CREATE_TABLE:
                break;
            default:
                break;
        }

        if (!callback) {
            return new Promise((resolve, reject) => {
                func.then(res => {
                    resolve(res);
                }).catch(err => {
                    reject(err);
                });
            });
        }

    };

    insert(model, callback) {
        let promise = new Promise((resolve, reject) => {

            if ((model instanceof AbstractModel) == false) {
                reject("Invalid model object received.");
            } else {
                this.__insertInternal(model)
                    .then(res => {
                        resolve(res);
                    }).catch(err => {
                        reject(err);
                    });
            }
        },this);

        if (!callback) {
            return promise;
        } else {
            promise.then(res => {
                callback(null, res);
            }).catch(err => {
                callback(err);
            });
        }
    };

    __insertInternal(model) {
        return new Promise((resolve, reject) => {
            reject("API not implemented.")
        });
    };

    __deleteInternal(model) {
        return new Promise((resolve, reject) => {
            reject("API not implemented.");
        });
    };

    __updateInternal(model) {
        return new Promise((resolve, reject) => {
            reject("API not implemented.");
        });
    }

    __findInternal(config) {
        return new Promise((resolve, reject) => {
            reject("API not implemented.");
        });
    };

    delete(model, callback) {
        let p = new Promise((resolve, reject) => {
            this.__deleteInternal(model)
                .then(res => {
                    resolve(res);
                }).catch(err => {
                    reject(err);
                });
        },this);

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

    update(model, callback) {
        let p = new Promise((resolve, reject) => {
            this.__updateInternal(model)
                .then(res => {
                    resolve(res);
                }).catch(err => {
                    reject(err);
                });
        },this);

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

    read(model, callback) {

        if (model) {
            return this.find(model, callback);
        }
        if (callback) {
            callback("No model config is provided to the read function.");
        } else {
            return new Promise((_, reject) => {
                reject("No model config is provided to the read function.");
            });
        }
    };

    createTable(dboperation, callback) {
        if (callback) {
            callback();
        }
    };

    find(config, callback) {
        if (callback) {
            this.__findInternal(config)
                .then(res => {
                    callback(null, res);
                }).catch(err => {
                    callback(err);
                });
        } else {
            return this.__findInternal(config);
        }
    };
};

AbstractDB.DB_STATES = DB_STATES;
AbstractDB.TRANSACTION_STATES = TRANSACTION_STATES;
exports.AbstractDB = AbstractDB;