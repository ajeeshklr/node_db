/**
 * Default store implementation for the framework code.
 * This is abstract class, which shall be overriden by derived classes providing correct details.
 * This store implementation doesn't cache model instances locally as it is created to serve huge databses.
 * 
 */

let AbstractModel = require('../data/factory/model/abstractmodel').AbstractModel;
let dbmanager = require('../data/dbmanager').DbManager;
let DBOperation = require('../data/factory/dboperation').DBOperation;
let DB_OP = require('../data/factory/dboperation').DB_OP;
let config = require('../config').getConfig();
let ModelManager = require("./modelmanager");


let eventMixin = require('./mixins').event;

let co = require('co');


let Store = class Store {

    /**
     * Default store constructor.
     */
    constructor() {
        this._storeName = '';
        this._supportedModel = '';
    };

    /**
     * Retrieve the store name.
     */
    storeName() {
        return this._storeName;
    };

    modelName() {
        return this._supportedModel;
    };

    add(model, callback) {

        let p = new Promise((resolve, reject) => {
            if (model instanceof AbstractModel) {
                if (model.modelName() == this.modelName()) {

                    var manager = dbmanager.getInstance();

                    // Let's use generators here as we are going to use promises.
                    co(function* () {
                        let db = yield manager.configure(config);
                        if (!db) {
                            callback(new Error('Internal server error. Could not connect to DB driver.'));
                            return;
                        }

                        let dbinstance = yield manager.openDatabase();
                        if (dbinstance && dbinstance.databaseName && dbinstance.databaseName == config.database.name) {
                            var operation = new DBOperation(DB_OP.DB_OP_INSERT, model);
                            let res = yield manager.execute(operation);

                            // Once it is done, fire an event.
                            //  this.fire('add', model); // Model is updated with ID and other fields, which are required.

                            resolve(res);
                        }

                    }).catch(err => {
                        console.log(err);
                        reject(err);

                    });
                }
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

    remove(model, criteria, callback) {

    };

    /**
     * 
     * @param {object} model A valid AbstractModel instance or custom object which satisfies the SDL rule of the client.
     * @param {object} criteria This is the expression object, which shall be passed to filter the records for updation. Criteria with only table name shall match all records in the table.
     * @param {function} callback Callback function to indicate success or failure of the operation. 
     * @returns Promise, if the callback function is not defined.
     * 
     * @description 
        Model should be as follows

        An instance of AbstractModel or 
        {
            "set": 
                [
                    {
                        "field1": "value1"
                    },
                    {
                        "field2": "value2"
                    }
                ]
        }

     * Criteria should be as follows.
                   {
                       "collection" : "modelname",
                       "filter": {
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
                       },
                       "clause": {          
                           upsert: < boolean > ,
                           multi: < boolean > ,
                           writeConcern: < document > ,
                           collation: < document > ,
                           arrayFilters: [ < filterdocument1 > , ...]
                       }
                   }

                   // Clause is not mandatory and can be omitted most of the time as it is specific to programming language.
     */
    update(model, criteria, callback) {

        let p = new Promise((resolve, reject) => {

            if (!criteria) {
                criteria = {
                    "collection": this.modelName()
                }
            };

            let updateObject = {};
            updateObject["criteria"] = criteria;

            if (model instanceof AbstractModel) {
                if (model.modelName() == this.modelName()) {
                    // Set the table / collection name.
                    updateObject["collection"] = this.modelName() || criteria.collection;

                    if (model.getId()) {
                        let filter = updateObject.criteria.filter || {};
                        if (!filter[model.getIdField()]) {
                            filter[model.getIdField()] = model.getId();
                            updateObject.criteria.filter = filter;
                        }
                    }

                } // model name check
            } // model instanceof
            else { // It is not an object, it could be a update object. Client shall check for valid criteria in this case.
                // Criteria should have table name as one of the valid parameter, otherwise, this will fail.
                if (criteria && Object.keys(criteria).indexOf("collection") >= 0) {
                    updateObject["collection"] = criteria["collection"];
                } else {
                    throw new Error("Invalid criteria. Collection details are not available in criteria.");
                }
            }

            updateObject["model"] = model; // Set the model or object for updation.

            var manager = dbmanager.getInstance();
            let _this = this;

            // Let's use generators here as we are going to use promises.
            co(function* () {
                let db = yield manager.configure(config);
                if (!db) {
                    callback(new Error('Internal server error. Could not connect to DB driver.'));
                    return;
                }
                var operation = new DBOperation(DB_OP.DB_OP_UPDATE, updateObject);
                let pr = manager.execute(operation, callback);
                if (pr) {
                    pr.then(res => {

                        if (updateObject.model instanceof AbstractModel && updateObject.model.getId()) {
                            resolve([updateObject.model]);
                        } else {
                            // Let's convert the document to a valid model instance.
                            // All the documents are updated now. Let's use the same query and find all the documents, which are updated.
                            let modifiedRecords = _this.find({
                                "filter": model instanceof AbstractModel ? updateObject.model.getUpdatorConfig() : updateObject.model.set
                            });
                            let models = [];
                            if (modifiedRecords) {
                                modifiedRecords.then(result => {

                                    let model = ModelManager.getInstance().get(_this.modelName());
                                    if (null != model) {
                                        result.forEach(element => {
                                            var m = new model();
                                            m.init(element.config.fields);
                                            m.setId(element[m.getIdField()]);
                                            models.push(m);
                                        });
                                    }

                                    resolve(models);

                                }).catch(error => {
                                    console.log(error);
                                    reject(err);

                                })
                            }
                        }

                    }).catch(err => {
                        reject(err);
                    });
                }
            }).catch(err => {
                console.log(err);
                callback(err);
            });
        });

        // As callback is passed to the dbmanager function, once the operation is successful inside dbmanager, the callback shall be called.
        // Return promise otherwise.

        if (!callback) {
            return p;
        }
    };


    /**
     * 
     * @param {Object} criteria Find all records which matches the criteria provided.
     * @param {function} callback Callback function to receive the response to the query.
     * @param {boolean} fireEvents True - Fire event once the model instance is read from database. False - doesn't fire any events.
     * @description
     *  A criteria can be seen as the follows. 
       {
           select : { "fields" : ["field1,"field2"..."fieldn] }
           clause : [
               {
                   "sort": [
                       {
                           "field" : "field1",
                           "order" : "asc"
                       },
                       {
                           "field" : "fieldn",
                           "order" : "desc"
                       }
                   ]
               },
               {
                   "limit" : "100" // Or a number field can be used.

               }
           ]
           filter : {
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

       If none of the criterias are provided, all entries in the store will be returned.

     */
    find(criteria, callback, fireEvents) {

        // It is possible to provide a null criteria if user want to read entire store.
        if (criteria && typeof (criteria) != "object") {
            throw new Error("Invalid criteria specified.");
        }

        let p = new Promise((resolve, reject) => {

            // Actual business logic to perform find operation.
            var config = {
                'model': this.modelName(),
                'query': criteria
            };

            var operation = new DBOperation(DB_OP.DB_OP_READ, config);
            let _readp = dbmanager.getInstance().execute(operation);
            // _readp is a promise, so let's wait for th promise to return.
            _readp.then(res => {
                resolve(res);

            }).catch(err => {
                reject(err);
            });

        });

        if (callback) {
            p.then(res => {
                callback(null, res);
                if (fireEvents) {
                    this.fire("find", res);
                }

            }).catch(err => {
                callback(err);
                if (fireEvents) {
                    this.fire("find", null, err);
                }
            });
        } else {
            return p;
        }

    };

};

Object.assign(Store.prototype, eventMixin);

exports.Store = Store; // Export to modules, so that other modules can use it once required.