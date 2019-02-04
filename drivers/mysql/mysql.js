"use strict";
/**
 * This class is the extention for MongoDB database.
 */
let AbstractDB = require('../abstractdb').AbstractDB;
let AbstractModel = require("../model/abstractmodel").AbstractModel;
let DbQuery = require("../../dbquery").Query;
var mysql = require('mysql');
var ModelManager = require('../../modelmanager');
let sqlparser = require('../utils/sql_parser');

let co = require('co');

let MySQLDB = class MySQLDB extends AbstractDB {

    initInternal(config) {

        var _this = this;
        return new Promise(async (resolve, reject) => {
            if (null == config) {
                reject('Invalid configuration passed on to MySQLClient.');
                return;
            }

            _this._config = config;

            console.log("Initializing MySQL driver!!");

            try {
                _this._connection = mysql.createConnection({
                    host: config.host,
                    user: config.username,
                    password: config.password,
                    database: config.name
                });

                _this._connection.on('end', () => {
                    _this._isConnected = false;
                });

                _this._connection.on('connect', () => {
                    _this._isConnected = true;
                });


                resolve(_this._connection); // This will always be resolved, most of the time.
            } catch (err) {
                reject("Could not initialize mysql driver.");
            }
        });
    }

    openInternal() {
        var _this = this;
        return new Promise((resolve, reject) => {

            if (!_this._connection) {
                // Try to create it 
                reject({
                    'Error': 400,
                    'Error Text': 'MySQL instance is invalid.'
                });
            } else {
                console.log('Opening connection with mysql db.');
                _this._connection.connect(function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        console.log("Connected!");
                        _this._isConnected = true;
                        resolve(_this._connection);
                    }
                });
            }
        });
    };

    closeInternal(callback) {

        var _this = this;
        return new Promise((resolve, reject) => {
            if (null == this._connection) {
                reject({
                    'Error': 400,
                    'Error Text': 'MySQL instance is invalid.'
                });
            } else {

                console.log('Closing connection with mysql db.');
                _this.getClientDb().end();

            }
        });
    };

    isConnected() {
        return this._isConnected;
    };

    disposeInternal() {

        var _this = this;

        return new Promise((resolve, reject) => {
            if (null == this._connection) {
                reject({
                    'Error': 400,
                    'Error Text': 'MySQL instance is invalid.'
                });
            } else {

                super.disposeInternal()
                    .then(res => {

                        if (_this._connection) {
                            _this._connection.destroy();
                            _this._connection = null;
                        }
                        _this._isConnected = false;

                    }).catch(err => {
                        reject(err);
                    });
            }
        });
    };

    insertInternal(model, callback) {

        this.getClientDb().query(sqlparser.convertToInsertQuery(model), (err, result) => {

            if (err) {
                if (callback) callback(err);
            } else {
                if (result.affectedRows > 0) {
                    model.setId(result.insertId);
                }
                if (callback) callback(null, [model]);
            }
        });

    };

    deleteInternal(model, callback) {
        var query = sqlparser.convertToDeleteQuery(model);
        this.getClientDb().query(query, callback);
    };

    updateInternal(updateObject, callback) {

        try {

            let queryString = sqlparser.convertToUpdateQuery(updateObject);
            if (null == queryString || queryString.length == 0) {
                reject("Invalid update object received.");
            }

            this.getClientDb().query(queryString, callback);

        } catch (error) {
            if (callback) callback(error);
        }
    };

    findInternal(config, callback) {

        /**
         * Valid configs are as follows
         {
        'model' : string,   // Name of the table used in mysql db.
        'query': {
             select: {
                 "fields": ["field1,"
                     field2 "..."
                     fieldn
                 ]
             }
             clause: [{
                     "sort": [{
                             "field": "field1",
                             "order": "asc"
                         },
                         {
                             "field": "fieldn",
                             "order": "desc"
                         }
                     ]
                 },
                 {
                     "limit": "100" // Or a number field can be used.

                 }
             ]
             filter: {
                 "or": [{
                         "and": [{
                                 __op: "=",
                                 "field1": "value1"
                             },
                             {
                                 __op: "!=",
                                 "field2": "value2"
                             },
                             {
                                 __op: "<",
                                 "field3": "value3"
                             },
                             {
                                 $a: ">",
                                 "field4": "value4"
                             }
                         ]
                     },
                     {
                         "or": {
                             "and": [{
                                     __op: "=",
                                     "field5": "value5"
                                 },
                                 {
                                     __op: "!=",
                                     "field6": "value6"
                                 }
                             ],
                             "<": {
                                 "field1": "100"
                             }
                         }
                     }
                 ]
             }

         }
         * }
         */

        try {

            let query = new DbQuery(config.model,
                config.query.select,
                config.query.filter,
                config.query.clause);
            let queryString = query.toSelect(); // Convert to query string.                

            this.getClientDb().query(queryString, (err, result) => {

                if (err) {
                    if (callback) callback(err);
                } else {
                    let models = [];
                    let m = ModelManager.getInstance().get(config.model);

                    for (var i = 0; i < result.length; i++) {
                        let instance = new m();
                        instance.store = this;
                        let currentInstance = result[i];
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

        } catch (error) {
            if (callback) callback(error);
        }
    };

    executeStatement(statement, callback) {
        if (typeof statement == "string") {
            // Perform SQL query against the databse and share result once it is done.
            try {
                this.getClientDb().query(queryString, callback);
            } catch (ex) {
                console.error(ex);
                if (callback) callback(ex);
            }

        } else {
            if (callback) callback("Invalid query statement. Exptected string, receive " + (typeof statement));
        }

    }
};

exports.DB = MySQLDB; // Export mongodb implementation so that it can be used.