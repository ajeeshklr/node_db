"use strict";

/**
 * 
 * This is the implementation for an abstract DB class.
 * This class shall take care of all basic CRUD operations.
 * A concrete implementation of this shall be provided separately for different DB implementations.
 * DB factory shall output this DB instance.
 * 
 */

let DBOP = require('./dboperation').DB_OP;
let AbstractModel = require('./abstractmodel').AbstractModel;


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
        this._transactionalModel = false;
        this._isDirty = false;
        this._clientdb = null; // No client DB created/opened initially.
    };

    updateTransactionalModelInternal(val) {
        this._transactionalModel = val;
    }

    isTransactionalModel() {
        return this._transactionalModel;
    }

    /**
     * This API is used to initialize the databse which is under use.
     * @param {Object} config Initialize database. This will either return a promise or accepts a callback.
     * @param {function} callback A callback function, if callback mechanism is used in the client application.
     * @returns void, if callback is used otherwise returns {Promise}
     */
    init(config, callback) {
        var _this = this;
        console.error("Initializing AbstractDB.");
        let p = new Promise(async (resolve, reject) => {

            if (null == config) {
                reject({
                    'Error': 400,
                    'Error Text:': 'Invalid configuration passed on to MongoClient.'
                });
                return;
            }

            try {
                var res = await _this.initInternal(config);
                _this.state = DB_STATES.DB_INIT;
                _this.config = config; // Save the config, so that it can be used later.
                resolve(res);

            } catch (ex) {
                console.error(ex);
                reject(ex); // Reject with the exception.
            }
        });

        // Callback with status and details. 
        if (callback) {
            p.then(res => callback(null, res))
                .catch(err => callback(err));
        } else {
            return p;
        }
    };

    /**
     * Derived classes should override this method and should not call super.initInternal
     * @param {config} config 
     */
    initInternal(config) {
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

        var _this = this;

        let p = new Promise(async (resolve, reject) => {
            if (_this.state == DB_STATES.DB_OPEN) { // Should not call open multiple time.
                console.log('Db is already open. Sending existing db instance back.!');
                return resolve(_this.getClientDb()); // DB is already open.;
            }

            if (null == _this.config) { // This is a rare scenario, should not happen in real use cases.
                reject(new Error("There is error in updating configuration."));
            }

            try {
                var res = await _this.openInternal();
                _this.state = DB_STATES.DB_OPEN;
                _this._clientdb = res;
                _this.databaseName = _this.config.name;
                resolve(res);
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
        }, );

        if (callback) {
            p.then(res => callback(null, res))
                .catch(err => callback(err))
        } else {
            return p;
        }
    }

    /**
     * This API shall be overriden by derived classes.
     * Internal function, should not be used elsewhere in code, other than from derived classes.
     */
    openInternal() {
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
        var _this = this;

        let p = new Promise(async (resolve, reject) => {
            if (_this.state == DB_STATES.DB_OPEN) { // Check if DB is already open.

                try {
                    // Wait for the commit message.
                    await _this.commit();

                    // Wait for databse to be closed.
                    var res = await _this.closeInternal();

                    // Set the DB state to close.
                    _this.state = DB_STATES.DB_CLOSE;
                    _this._clientdb = null;
                    // Resolve once the DB is closed.
                    resolve(res);
                } catch (ex) {
                    reject({
                        'Error': 400,
                        'Error Text': 'Error closing database.'
                    });
                }
            } else {
                reject('DB is not open.');
            }
        });

        if (callback) {
            p.then(res => callback(null, res))
                .catch(err => callback(err))
        } else {
            return p;
        }
    }

    getClientDb() {
        return this._clientdb;
    }

    /**
     * Must be overriden in derived class.
     * Provide appropriate implementation in derived class.
     */
    isConnected() {
        return false;
    }

    /**
     * This API shall be overriden by derived class inorder to achieve the desired result.
     * Call to baseclass method is mandatory as it changes status of the DB and commits are getting called.
     * When overriden in derived class, call to this base class method shall be made without callback function.
     * @param {function} callback Callback to indicate operation status async.
     */
    closeInternal() {
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
        var _this = this;
        let p = new Promise(async (resolve, reject) => {
            if (_this.state != DB_STATES.DB_INVALID) {

                try {
                    var res = await disposeInternal();
                    _this.state = DB_STATES.DB_INVALID;
                    resolve(res);
                } catch (ex) {
                    console.error(ex);
                    reject(ex);
                }
            } else {
                reject("Database is not open or underlying driver is not initialized.");
            }
        });

        if (callback) {
            p.then(res => callback(null, res))
                .catch(err => callback(err));
        } else {
            return p;
        }

    };

    /// Internal function, which can be overridden by derived classes.
    // Use this API to perform begin transaction, for a transactional model.
    performBeginTransactionInternal() {

    };

    /// API to perform END transaction.
    /// This can be overridden by derived classes.
    performEndTransactionInternal() {

    };

    /// Internal method, which can be overridden by derived classes.
    /// Code for performing commit operations are placed here.
    performCommitInternal() {

    };

    // Dispose method, which shall be overridden by derived classes.
    // Any call to this function is mandatory.
    disposeInternal() {

        var _this = this;
        return new Promise(async (resolve, reject) => {
            try {
                var res = await _this.closeDatabase();
                resolve(res);
            } catch (ex) {
                console.log('\x1b[31m%s\x1b[0m%s-%s', 'Error - closeDatabase ', err, data);
                console.log('Failed to close the database when dispose is called.');
                reject(ex);
            }
        });
    };

    beginTransaction() {
        var _this = this;
        return new Promise(async (resolve, reject) => {
            if (_this.isTransactionalModel()) {
                if (_this._transaction_state != TRANSACTION_STATES.STATE_BEGIN) {
                    _this._transaction_state = TRANSACTION_STATES.STATE_BEGIN;
                    await _this.performBeginTransactionInternal();
                }
                resolve();
            } else {
                reject();
            }
        });

    };

    endTransaction() {

        var _this = this;
        return new Promise(async (resolve, reject) => {
            if (_this.isTransactionalModel()) {
                if (_this._transaction_state != TRANSACTION_STATES.STATE_INVALID &&
                    _this._transaction_state != TRANSACTION_STATES.STATE_ENDED) {

                    await _this.performEndTransactionInternal();
                    _this._transaction_state = _this._isDirty ?
                        RANSACTION_STATES.STATE_END_COMMIT_PENDING :
                        TRANSACTION_STATES.STATE_ENDED;

                }
                resolve();
            } else {
                reject();
            }
        });

    };

    commit() {
        var _this = this;
        return new Promise(async (resolve, reject) => {
            if (_this.isTransactionalModel()) {
                if (_this._transaction_state = TRANSACTION_STATES.STATE_END_COMMIT_PENDING) {
                    _this._transaction_state = TRANSACTION_STATES.STATE_COMMIT_IN_PROGRESS;
                    await _this.performCommitInternal();
                    _this._isDirty = false;
                    _this._transaction_state = TRANSACTION_STATES.STATE_INVALID; //
                    resolve();
                }
            } else {
                reject();
            }
        });
    };

    execute(dboperation, callback) {

        if (null == dboperation ||
            null == dboperation.record) {
            console.error("Invalid dboperation while performing execute");
            if (callback) {
                callback(400, 'Invalid parameters received.');
                return;
            } else {
                return new Promise((resolve, reject) => {
                    reject('Invalid parameters recived.');
                });
            }
        }

        if (this.state != AbstractDB.DB_STATES.DB_OPEN ||
            null == this._clientdb) {
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
                func = this.insert(dboperation.record, callback);
                break;
            case DBOP.DB_OP_DELETE:
                func = this.delete(dboperation.record, callback);
                break;
            case DBOP.DB_OP_READ:
                func = this.read(dboperation.record, callback);
                break;
            case DBOP.DB_OP_UPDATE:
                func = this.update(dboperation.record, callback);
                break;
            case DBOP.DB_OP_CREATE_TABLE:
                func = this.createTable(dboperation.record, callback);
                break;
            default:
                break;
        }

        if (!callback) {
            return new Promise((resolve, reject) => {
                func.then(res => resolve(res))
                    .catch(err => reject(err));
            });
        }

    };

    insert(record, callback) {

        var _this = this;
        let promise = new Promise(async (resolve, reject) => {

            if ((record instanceof AbstractModel) == false) {
                reject("Invalid AbstractModel object received.");
            } else {
                try {
                    var res = await _this.insertInternal(record);
                    resolve(res);
                } catch (ex) {
                    console.error(ex);
                    reject(ex);
                }
            }
        });

        if (!callback) {
            return promise;
        } else {
            promise.then(res => callback(null, res))
                .catch(err => callback(err));
        }
    };

    insertInternal(record) {
        return new Promise((resolve, reject) => {
            reject("API not implemented.")
        });
    };

    deleteInternal(record) {
        return new Promise((resolve, reject) => {
            reject("API not implemented.");
        });
    };

    updateInternal(record) {
        return new Promise((resolve, reject) => {
            reject("API not implemented.");
        });
    }

    findInternal(config) {
        return new Promise((resolve, reject) => {
            reject("API not implemented.");
        });
    };

    async delete(record, callback) {
        var _this = this;
        let p = new Promise((resolve, reject) => {
            try {
                var res = _this.deleteInternal(record);
                resolve(res);
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
        });

        if (callback) {
            p.then(res => callback(null, res))
                .catch(err => callback(err));
        } else {
            return p;
        }
    };

    update(record, callback) {
        var _this = this;

        let p = new Promise(async (resolve, reject) => {
            try {
                var res = await _this.updateInternal(record);
                resolve(res);
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
        });

        if (callback) {
            p.then(res => callback(null, res))
                .catch(err => callback(err));
        } else {
            return p;
        }
    };

    /**
     * Read a record from database, based on the record or configuration passed.
     * @param {AbstractModel} record 
     * @param {function} callback 
     */
    async read(record, callback) {

        if (record) {
            return await this.find(record, callback);
        }
        if (callback) {
            callback("No config is provided to the read function.");
        } else {
            return new Promise((_, reject) => {
                reject("No  config is provided to the read function.");
            });
        }
    };

    /**
     * Abstract create table method.
     * @param {AbstractModel} record 
     * @param {function} callback 
     */
    createTable(record, callback) {
        if (callback) {
            callback();
        }
    };

    /**
     * find method.
     * @param {JSON} config 
     * @param {function} callback 
     */
    async find(config, callback) {
        if (callback) {
            try {
                var res = await this.findInternal(config);
                callback(null, res);
            } catch (ex) {
                console.error(ex);
                callback(ex);
            }
        } else {
            return this.findInternal(config); // Return a promise instead.
        }
    };

    /**
     * Execute a statement against the database.
     * This is very useful if you need to perform custom queries, like joins for SQL.
     * This need to be implemented in the respective databses.
     * This API is provided to support extensibility. The result shall be parsed by the caller. 
     * 
     * Use this to perform any select or filter queries, than performing update/save/delete operations.
     * Also, this can be used to perform queries like the below.
     * 
     * 1. CREATE TABLE
     * 2. DROP TABLE
     * 3. JOIN
     * 
     * @param {String or Object} statement 
     */
    executeStatement(statement) {

    }

    getDatabaseType() {
        return this.config.type != null && typeof (this.config.type) == 'string' ? this.config.type : '';
    }



};

AbstractDB.DB_STATES = DB_STATES;
AbstractDB.TRANSACTION_STATES = TRANSACTION_STATES;
exports.AbstractDB = AbstractDB;