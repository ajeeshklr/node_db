"use strict";
/**
 * This class is the extention for MongoDB database.
 */
let AbstractDB = require('../abstractdb').AbstractDB;
let MongoQuery = require("../db/mongoquery").MongoQuery;
let AbstractModel = require("../model/abstractmodel").AbstractModel;

let mongo = require('mongodb').MongoClient;
let co = require('co');

let MongoDB = class MongoDB extends AbstractDB {

    __initInternal(config) {
        return new Promise((resolve, reject) => {
            if (null == config) {
                reject('Invalid configuration passed on to MongoClient.');
                return;
            }

            // console.log('Connecting to mongodb url - ' + config.url);
            mongo.connect(config.url)
                .then((db) => {
                    console.log("Successfully connected.")
                    this._mongoclient = db;
                    resolve(db);
                }).catch(err => {
                    // console.log(err);
                    reject(err);
                });
        });
    }

    __openInternal() {
        return new Promise((resolve, reject) => {

            if (null == this._mongoclient) {
                reject({
                    'Error': 400,
                    'Error Text': 'MongoClient instance is invalid.'
                });
            } else {
                console.log('Opening connection with mongo db.');
                this._clientdb = this._mongoclient.db(this.config.name); // name of the db to connec to.
                if (this._clientdb) {
                    resolve(this._clientdb);
                } else {
                    reject('Failed to create db using the MongoClient interface.')
                }
            }
        });
    };

    __closeInternal(callback) {

        return new Promise((resolve, reject) => {
            if (null == this._mongoclient) {
                reject({
                    'Error': 400,
                    'Error Text': 'MongoClient instance is invalid.'
                });
            } else {
                console.log('Closing connection with mongo db.');
                this._mongoclient.close()
                    .then(res => {
                        // console.log(res);
                        resolve(res);
                    }).catch(err => {
                        reject(err);
                    });
            }
        });
    };

    isConnected() {
        if (null == this._mongoclient) {
            return false;
        }

        return this._mongoclient.isConnected();
    };

    __disposeInternal() {

        return new Promise((resolve, reject) => {
            if (null == this._mongoclient) {
                reject({
                    'Error': 400,
                    'Error Text': 'MongoClient instance is invalid.'
                });
            } else {
                super.__disposeInternal()
                    .then(res => {
                        this._mongoclient.logout()
                            .then(val => {
                                resolve(val);
                            }).catch(err => {
                                reject(err);
                            });

                    }).catch(err => {
                        reject(err);
                    });
            }
        });
    };

    __insertInternal(model) {
        return new Promise((resolve, reject) => {
            this._clientdb.collection(model.modelName()).insertOne(model)
                .then(res => {
                    if (res.insertedCount == 1 && res.result.ok) {
                        if (res.ops && res.ops.length > 0) {
                            resolve(res.ops);
                        } else {
                            resolve(res);
                        }
                    } else {
                        reject(res);
                    }
                }).catch(err => {
                    // console.log(err);
                    reject(err);
                });

        });
    };

    __deleteInternal(model) {

        return new Promise((resolve, reject) => {
            reject("Not implemented");
        });

    };

    __updateInternal(updateObject) {

        return new Promise((resolve, reject) => {
            // model should have the following fields.
            if (updateObject) {

                if (updateObject.collection) {
                    // Check to see if the model object or AbstractModel instance is valid.
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
                        var writeresult = this._clientdb.collection(updateObject.collection).update(queryObject.filter, queryObject.update, queryObject.clause);

                        if (writeresult) {
                            writeresult.then(res => {
                                // console.log(res);
                                resolve(res);

                            }).catch(err => {
                                reject(err);
                            });
                        } else {
                            reject("Update failed.");
                        }
                    } catch (error) {
                        reject(error);
                    }


                } else {
                    reject("Invalid updateObject received. Collection name is not present in updateObject.")
                }

            } else {
                reject("Invalid updateObject received.");
            }


        });
    };

    __findInternal(config) {

        return new Promise((resolve, reject) => {

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
                let mongoQuery = new MongoQuery(config.model, config.query.select, config.query.filter, config.query.clause);
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
                // console.log("Test Data : ");
                // console.log(testData);

                // console.log("Query Object: ");
                // console.log(queryObject);

                // console.log("Data - ");
                // console.log(data);

                // console.log("Query String : ");
                // console.log(queryString);


                var findCursor = this._clientdb.collection(config.model).find(queryObject);

                if (findCursor) {
                    resolve(findCursor.toArray());
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