let AbstractDB = require('../../framework/core/db/abstractdb').AbstractDB;
let ModelManager = require('../../framework/core/db/modelmanager').ModelManager;
let sqlparser = require('../utils/sql_parser');
let DBOP = require('../../framework/core/db/dboperation').DB_OP;

let SqliteCipher = class SqliteCipher extends AbstractDB {

    constructor() {
        super();
        this.queue = [];
        this.busy = false;
    }

    initInternal(config) {
        var _this = this;
        return new Promise((resolve, reject) => {
            // Check if the config is valid.

            if (null == config) {
                reject("Invalid configuration");
            }

            _this._sqlite3 = require(config.module);
            resolve(_this._sqlite3); // This is the sqlite3 module.

        });
    }

    openInternal() {
        var _this = this;
        return new Promise((resolve, reject) => {
            if (_this.config) {

                let path = require('path');
                let processPath = process.cwd(); // Current working path of the node.js process.
                let dbname = path.resolve(processPath, path.join(_this.config.db_path, _this.config.name));

                // Need to use the parameters to open database and perform operations.
                var db = new _this._sqlite3.Database(dbname);
                db.serialize(function () {
                    // Configure cipher for the database.
                    db.run("PRAGMA KEY = '" + _this.config.password + "'");
                    db.run("PRAGMA CIPHER = 'aes-128-cbc'");
                });

                resolve(db);
            } else {
                reject("Invalid configuration");
            }
        });
    }

    closeInternal() {
        var _this = this;
        return new Promise((resolve, reject) => {
            if (_this.getClientDb()) {
                _this.getClientDb().close((err) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } else {
                reject("DB is not initialized or opened!");
            }
        });

    }

    async disposeInternal() {
        await super.disposeInternal();
        this._sqlite3 = null;
    }

    insertInternal(model, callback) {
        var db = _this.getClientDb();
        db.run(
            sqlparser.convertToInsertQuery(model),
            [],
            function (err) {
                if (err) {
                    console.error(err);
                    if (callback) callback(err);
                } else {
                    model.setId(this.lastID);
                    if (callback) callback(null, model);
                }
            });
    }

    deleteInternal(model, callback) {


        var query = sqlparser.convertToDeleteQuery(model);
        this.getClientDb().run(query, [], function (err) {
            if (err) {
                console.error(err);
                if (callback) callback(err);
            } else {
                if (callback) callback(null, this.changes);
            }
        });
    }

    updateInternal(updateObject) {

        try {
            let queryString = sqlparser.convertToUpdateQuery(updateObject);
            if (null == queryString || queryString.length == 0) {
                if (callback) callback("Invalid update object received.");
            }

            this.getClientDb().run(queryString, [], function (err) {
                if (err) {
                    if (callback) callback(err);
                } else {
                    if (callback) callback(null, this.changes);
                }
            });

        } catch (error) {
            if (callback) callback(error);
        }
    }

    findInternal(config, callback) {

        let query = new DbQuery(config.model, config.query.select, config.query.filter, config.query.clause);
        let queryString = query.toSelect(); // Convert to query string.
        query = null;

        this.getClientDb().all(queryString, (err, rows) => {
            if (err) {
                console.error(err);
                if (callback) callback(err);
            } else {
                let models = [];
                let m = ModelManager.getInstance().get(config.model);

                for (var i = 0; i < rows.length; i++) {
                    let instance = new m();
                    instance.store = this;
                    let currentInstance = rows[i];
                    instance.beginInit();
                    instance.getFields().forEach(field => {
                        instance.set(field, currentInstance[field]);
                    })
                    instance.endInit();
                    instance.setId(currentInstance[instance.getIdField()]);
                    models.push(instance);

                }
                if (callback) callback(null, models);
            }
        });
    }

    executeStatement(statement) {
        var db = this.getClientDb();

        if (typeof statement == "string") {
            // Perform SQL query against the databse and share result once it is done.
            try {
                db.run(statement, [], function (err) {
                    if (callback) callback(err, this);
                });
            } catch (ex) {
                console.error(ex);
                if (callback) callback(ex);
            }
        }

    }

    execute(dboperation, callback) {

        if (null == dboperation ||
            null == dboperation.record) {
            console.error("Invalid dboperation while performing execute");
            if (callback) {
                callback(400, 'Invalid parameters received.');
                return;
            }
        }

        if (this.state != AbstractDB.DB_STATES.DB_OPEN ||
            null == this._clientdb) {
            if (callback) {
                callback(500, 'Database is not open or databse is not initialized.');
                return;
            }
        }

        let queueParam = {
            "function": function (dboperation, callback) {
                switch (dboperation.operation) {
                    case DBOP.DB_OP_INSERT:
                        this.insert(dboperation.record, callback);
                        break;
                    case DBOP.DB_OP_DELETE:
                        this.delete(dboperation.record, callback);
                        break;
                    case DBOP.DB_OP_READ:
                        this.read(dboperation.record, callback);
                        break;
                    case DBOP.DB_OP_UPDATE:
                        this.update(dboperation.record, callback);
                        break;
                    case DBOP.DB_OP_CREATE_TABLE:
                        this.createTable(dboperation.record, callback);
                        break;
                    default:
                        break;
                }
            },
            "params": [dboperation, callback]
        }

        this.queue.push(queueParam);
        process.nextTick(executeTask);

    };

    executeTask() {
        if (this.busy) {
            return;
        }

        this.busy = true;
        var queueParam = this.queue.pop();
        if (null == queueParam) {
            this.busy = false;
        } else {

            queueParam.function(queueParam.params[0], (err, res) => {
                this.busy = false;
                if (null != queueParam.params[1]) queueParam.params[1](err, res);
                process.nextTick(executeTask);
            });

        }
    }

}

exports.DB = SqliteCipher;