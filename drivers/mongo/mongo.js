"use strict";
/**
 * This class is the extention for MongoDB database.
 */
let AbstractDB = require('../../framework/core/db/abstractdb').AbstractDB;
let AbstractModel = require('../../framework/core/db/abstractmodel').AbstractModel;
let MongoQuery = require("./mongoquery").MongoQuery;

let mongo = require('mongodb').MongoClient;
let co = require('co');

let MongoDB = class MongoDB extends AbstractDB {


    initInternal(config) {

        var _this = this;

        console.error("Inside MongoDB __initInternal.");
        return new Promise(async (resolve, reject) => {

            if (null == config) {
                reject('Invalid configuration passed on to MongoClient.');
                return;
            }

            try {
                _this._mongoclient = await mongo.connect(config.url, {
                    useNewUrlParser: true
                });
                resolve(_this._mongoclient);
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
        });
    }

    openInternal() {

        var _this = this;
        return new Promise((resolve, reject) => {

            if (null == _this._mongoclient) {
                reject({
                    'Error': 400,
                    'Error Text': 'MongoClient instance is invalid.'
                });
            } else {
                console.log('Opening connection with mongo db.');
                var database = _this._mongoclient.db(_this.config.name); // name of the db to connec to.
                if (database) {
                    resolve(database);
                } else {
                    reject('Failed to create db using the MongoClient interface.')
                }
            }
        });
    };

    async closeInternal(callback) {

        var _this = this;
        console.error("Closing mongodb instance");
        return new Promise((resolve, reject) => {
            if (null == _this._mongoclient) {
                reject({
                    'Error': 400,
                    'Error Text': 'MongoClient instance is invalid.'
                });
            } else {
                console.log('Closing connection with mongo db.');
                try {
                    _this._mongoclient.close();
                    resolve();
                } catch (ex) {
                    console.error(ex);
                    reject(ex);
                }
            }
        });
    };

    isConnected() {
        if (null == this._mongoclient) {
            return false;
        }
        return this._mongoclient.isConnected();
    };

    disposeInternal() {

        var _this = this;
        console.error("Disposing mongodb instance");

        return new Promise(async (resolve, reject) => {
            if (null == _this._mongoclient) {
                reject({
                    'Error': 400,
                    'Error Text': 'MongoClient instance is invalid.'
                });
            } else {
                try {
                    var res = await super.disposeInternal();
                    await _this._mongoclient.logout();
                    resolve(res);
                } catch (ex) {
                    console.error(ex);
                    reject(ex);
                }

            }
        });
    };

    insertInternal(record) {
        var _this = this;
        return new Promise(async (resolve, reject) => {
            try {
                var res = await _this.getClientDb().collection(record.modelName()).insertOne(record.toJSON());
                if (res.insertedCount == 1 && res.result.ok) {
                    if (res.ops && res.ops.length > 0) {
                        resolve(res.ops);
                    } else {
                        resolve(res);
                    }
                } else {
                    reject(res);
                }
            } catch (ex) {
                console.error(ex);
                reject(ex);
            }
        });
    };

    deleteInternal(model) {

        return new Promise((resolve, reject) => {
            reject("Not implemented");
        });

    };

    updateInternal(updateObject) {

        var _this = this;
        return new Promise(async (resolve, reject) => {
            // model should have the following fields.
            if (updateObject && updateObject.collection) {

                // Check to see if the record object or AbstractModel instance is valid.
                if (!updateObject.model || !updateObject.criteria) {
                    reject("Invalid model or criteria received in updateObject.");
                }

                let update = {};

                if (updateObject.model instanceof AbstractModel) {
                    update["set"] = updateObject.model.getUpdatorConfig();
                } else if (typeof (updateObject.model) == "object") {
                    update["set"] = updateObject.model.set;
                }


                // Criteria might have the following.
                // "filter" - for any filters
                // clause for any clauses.

                Object.keys(updateObject.criteria).forEach(element => {
                    switch (element) {
                        case "filter":
                            update["filter"] = updateObject.criteria.filter;
                            break;
                        case "clause":
                            update["clause"] = updateObject.criteria.clause;
                            break;
                    }
                });

                try {
                    let mongoQuery = new MongoQuery(updateObject.collection, update.set, update.filter, update.clause);
                    let queryObject = mongoQuery.toUpdate(); // Convert to query object.

                    var writeresult = await _this.getClientDb().collection(updateObject.collection)
                        .update(queryObject.filter,
                            queryObject.update,
                            queryObject.clause);

                    resolve(writeresult);
                    queryObject = null;
                    mongoQuery = null;

                } catch (error) {
                    console.error(error);
                    reject(error);
                }

            } else {
                reject("Invalid updateObject received.");
            }


        });
    };

    findInternal(config) {

        var _this = this;

        return new Promise(async (resolve, reject) => {

            /**
             * Valid configs are as follows
             * {
             *  'model' : string,   // Name of the collection used in mongo db.
             *'query': {
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
                                     __op: "==",
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
                                         __op: "==",
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

                let mongoQuery = new MongoQuery(config.model,
                    config.query.select,
                    config.query.filter,
                    config.query.clause);

                let queryObject = mongoQuery.toSelect(); // Convert to query object.

                let queryString = "";
                Object.keys(queryObject).forEach(key => {
                    if (queryString.length > 0) {
                        queryString += ",";
                    }
                    queryString += "'" + key + "':" + queryObject[key];
                });

                queryString = "{" + queryString + "}";
                var BSON = require('bson');
                var bson = new BSON();
                var data = bson.deserialize(bson.serialize(queryObject));

                let testData = {
                    'config.fields.age': {
                        $eq: 30
                    }
                };

                var findCursor = _this.getClientDb().collection(config.model).find(queryObject);

                if (findCursor) {
                    var val = await findCursor.toArray();
                    resolve(val);
                } else {
                    reject("Could not retrieve resources.");
                }
            } catch (error) {
                reject(error);
            }
        });
    };
};

exports.DB = MongoDB; // Export mongodb implementation so that it can be used.