let AbstractDB = require('../../framework/core/db/abstractdb').AbstractDB;
let ModelManager = require('../../framework/core/db/modelmanager').ModelManager;
let sqlparser = require('../utils/sql_parser');

let SqliteCipher = class SqliteCipher extends AbstractDB {

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
                // Need to use the parameters to open database and perform operations.
                var db = new _this._sqlite3.Database(_this.config.name);
                // Configure cipher for the database.
                db.run("PRAGMA KEY = '" + _this.config.password + "'");
                db.run("PRAGMA CIPHER = 'aes-128-cbc'");

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

    insertInternal(model) {

        var _this = this;
        return new Promise((resolve, reject) => {

            _this.getClientDb().run(
                sqlparser.convertToInsertQuery(model),
                [], (err) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        model.setId(this.lastID);
                        resolve(model);
                    }
                });
        });

    }

    deleteInternal(model) {

        var _this = this;
        return new Promise((resolve, reject) => {
            var query = sqlparser.convertToDeleteQuery(model);
            _this.getClientDb().run(query, (err) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
        });

    }

    updateInternal(updateObject) {
        var _this = this;
        return new Promise((resolve, reject) => {

            try {

                let queryString = sqlparser.convertToUpdateQuery(updateObject);
                if (null == queryString || queryString.length == 0) {
                    reject("Invalid update object received.");
                }

                _this.getClientDb().query(queryString, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (result.affectedRows > 0) {
                            resolve(result);
                        } else {
                            reject(result);
                        }
                    }
                });

            } catch (error) {
                reject(error);
            }

        });
    }

    findInternal(config) {
        var _this = this;
        return new Promise((resolve, reject) => {
            let query = new DbQuery(config.model, config.query.select, config.query.filter, config.query.clause);
            let queryString = query.toSelect(); // Convert to query string.
            query = null;

            this.getClientDb().all(queryString, (err, rows) => {
                if (err) {
                    console.error(err);
                    reject(err);
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
                    resolve(models);
                }
            });

        });
    }

    executeStatement(statement) {
        return new Promise((resolve, reject) => {
            if (typeof statement == "string") {
                // Perform SQL query against the databse and share result once it is done.
                try {
                    this.getClientDb().run(queryString, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                } catch (ex) {
                    console.error(ex);
                    reject(ex);
                }

            } else {
                reject("Invalid query statement. Exptected string, receive " + (typeof statement));
            }
        });

    }

}

module.exports = SqliteCipher;