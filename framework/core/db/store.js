/**
 * Default store implementation for the framework code.
 * This is abstract class, which shall be overriden by derived classes providing correct details.
 * This store implementation doesn't cache model instances locally as it is created to serve huge databses.
 * 
 */

let AbstractModel = require('./abstractmodel').AbstractModel;
let DBOperation = require('./dboperation').DBOperation;
let DB_OP = require('./dboperation').DB_OP;
let ModelManager = require("./modelmanager");
let eventMixin = require('../mixins/mixins').event;
let AbstractDB = require('./abstractdb').AbstractDB;

let co = require('co');


let Store = class Store {

    /**
     * Default store constructor.
     */
    constructor() {
        this._storeName = '';
        this._supportedModel = '';
        this.database = null;
        console.error("Inside store constructor");
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

        if (model instanceof AbstractModel) {
            if (model.modelName() == this.modelName()) {

                var operation = new DBOperation(DB_OP.DB_OP_INSERT, model);
                this.execute(operation, callback);
                operation = null;

            } else {
                if (callback)
                    callback("Invalid model instance. Model name doesn't match!");
            }
        } else {
            if (callback)
                callback("Model is not instance of AbstractModel");
        }

    };

    remove(model, criteria, callback) {

    };

    /**
     * Execute DB operation on the DB underlying.
     */
    execute(dboperation, callback) {

        if (!this.database) {
            if (callback) {
                callback(400, 'Invalid database or database is not initialized.');
            }
        } else {
            if (this.database.state != AbstractDB.DB_STATES.DB_INVALID) {
                this.database.execute(dboperation, callback);
            } // this.database.state != AbstractDB.DB_STATES.DB_INVALID
        } // else
    }; // execute


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
                if (callback) {
                    callback("Invalid criteria. Collection details are not available in criteria.");
                } else {
                    throw new Error("Invalid criteria. Collection details are not available in criteria.");
                }

            }
        }

        updateObject["model"] = model; // Set the model or object for updation.

        var operation = new DBOperation(DB_OP.DB_OP_UPDATE, updateObject);
        this.execute(operation, (err, res) => {
            if (err) {
                callback(err);
            } else {
                if (updateObject.model instanceof AbstractModel &&
                    updateObject.model.getId()) {
                    if (callback)
                        callback(null, [updateObject.model]);
                } else {
                    // Let's convert the document to a valid model instance.
                    // All the documents are updated now. Let's use the same query and find all the documents, which are updated.
                    this.find({
                        "filter": model instanceof AbstractModel ?
                            updateObject.model.getUpdatorConfig() : updateObject.model.set
                    }, (e, result) => {
                        let model = ModelManager.getInstance().get(this.modelName());
                        if (null != model) {
                            result.forEach(element => {
                                var m = new model();
                                m.store = this;
                                m.init(element.config.fields);
                                m.setId(element[m.getIdField()]);
                                models.push(m);
                            });
                        }
                        callback(null, result);
                    });
                }
            }

        });
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
            if (callback) {
                callback("Invalid criteria specified.");
            } else
                throw new Error("Invalid criteria specified.");
        }

        // Actual business logic to perform find operation.
        var config = {
            'model': _this.modelName(),
            'query': criteria
        };

        var operation = new DBOperation(DB_OP.DB_OP_READ, config);
        this.execute(operation, callback);

    };

};

Object.assign(Store.prototype, eventMixin);

exports.Store = Store; // Export to modules, so that other modules can use it once required.