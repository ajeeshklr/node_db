/**
 * Main application file. Once application is getting started, it shall execute this file.
 * In some application, it might be index.js
 */
//#region What we require here, for developing application.

let config = require('./config');

let Query = require('./framework/core/db/dbquery').Query;
let MongoQuery = require("./drivers/mongo/mongoquery").MongoQuery;

testSelectQueryComplex = function () {
    let expObj = {
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
                        __op: ">",
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
    };

    let select = {
        "fields": ["field1", "field2", "field3"]
    };

    let clauses = [{
            "sort": [{
                "field": "field1",
                "order": "asc"
            }, {
                "field": "field2",
                "order": "desc"
            }]
        },
        {
            "limit": 100
        }
    ];

    let query = new Query("users", select, expObj, clauses);
    console.error(query.toSelect());
    console.log(query);

    let mongoQ = new MongoQuery("users", select, expObj, clauses);
    console.error(mongoQ.toSelect());
    console.log(mongoQ);
}


testSelectQuerySimple = function () {

    let expObj = {
        "or": {
            "field1": "value1",
            "field2": "value2"
        }
    };

    let select = {
        "fields": ["field1", "field2", "field3"]
    };

    let clauses = [{
            "sort": [{
                "field": "field1",
                "order": "asc"
            }, {
                "field": "field2",
                "order": "desc"
            }]
        },
        {
            "limit": 100
        }
    ];

    let query = new Query("users", select, expObj, clauses);
    console.error(query.toSelect());
    console.log(query);

    let mongoQ = new MongoQuery("users", select, expObj, clauses);
    console.error(mongoQ.toSelect());
    console.log(mongoQ);

}

testUpdateQueryComplex = function () {

    let expObj = {
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
                        __op: ">",
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
    };

    let update = {

        "field1": "value1",
        "field2": "value2",
        "field3": "value3"

    };

    let clauses = [{
            "sort": [{
                "field": "field1",
                "order": "asc"
            }, {
                "field": "field2",
                "order": "desc"
            }]
        },
        {
            "limit": 100
        }
    ];

    let query = new Query("users", update, expObj, clauses);
    console.error(query.toUpdate());
    console.log(query);

    let mongoQ = new MongoQuery("users", update, expObj, clauses);
    console.error(mongoQ.toUpdate());
    console.log(mongoQ);
}

testUpdateQuerySimple = function () {

    let expObj = {
        "or": {
            "field1": "value1",
            "field2": "value2"
        }
    };

    let update = {

        "field1": "value1",
        "field2": "value2",
        "field3": "value3"

    };

    let clauses = [{
            "sort": [{
                "field": "field1",
                "order": "asc"
            }, {
                "field": "field2",
                "order": "desc"
            }]
        },
        {
            "limit": 100
        }
    ];

    let query = new Query("users", update, expObj, clauses);
    console.error(query.toUpdate());
    console.log(query);

    let mongoQ = new MongoQuery("users", update, expObj, clauses);
    console.error(mongoQ.toUpdate());
    console.log(mongoQ);
}


testInsertQuery = function () {

    let insert = {
        "fields": ["field1", "field2"],
        "values": ["value1,value2"]
    };


    let query = new Query("users", insert, null, null);
    console.error(query.toInsert());
    console.log(query);

    let mongoQ = new MongoQuery("users", insert, null, null);
    console.error(mongoQ.toInsert());
    console.log(mongoQ);
}

testDeleteQuery = function () {

    let deleteq = {

        "field1": "value1",
        "field2": "value2",
        "field3": "value3"

    };


    let query = new Query("users", deleteq, null, null);
    console.error(query.toDelete());
    console.log(query);

    let mongoQ = new MongoQuery("users", deleteq, null, null);
    console.error(mongoQ.toDelete());
    console.log(mongoQ);
}

testDeleteComplexQuery = function () {

    let expObj = {
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
                        __op: ">",
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
    };


    let query = new Query("users", null, expObj, null);
    console.error(query.toDelete());
    console.log(query);

    let mongoQ = new MongoQuery("users", null, expObj, null);
    console.error(mongoQ.toDelete());
    console.log(mongoQ);
}

// For select


testSelectQueryComplex();
testSelectQuerySimple();
testUpdateQueryComplex();
testUpdateQuerySimple();
testInsertQuery();
testDeleteQuery();
testDeleteComplexQuery();




console.log(config); // Let's see what does come out of it.



if (typeof (config.getConfig()) == "object") {

    const dbmanager = require('./framework/managers/dbmanager').DbManager;
    dbmanager.getInstance().configure(config.getConfig()).then((res) => {
        if (res) {
            dbmanager.getInstance().openDatabase().then((db) => {
                // Initialise model manager and other necessay components, even before application starts.
                if (config.getModelConfig() && config.getModelConfig().length > 0) {
                    console.error("Initializing model manager configurations from config.js");
                    const ModelManager = require("./framework/core/db/modelmanager");
                    ModelManager.getInstance().configure(config.getModelConfig());
                }

                // Initialise store manager and other necessay components, even before application starts.
                if (config.getStoreConfig() && config.getStoreConfig().length > 0) {
                    console.error("Initializing store manager configurations from config.js");
                    const StoreManager = require("./framework/managers/storemanager").StoreManager;
                    StoreManager.getInstance().configure(config.getStoreConfig());
                }
            });
        }

    }).catch(err => {
        console.error(err);
    });






    console.log(config.getConfig());
    let runnable = require(config.getConfig().basePath + config.getConfig().js);
    runnable.init();
}

/*
const main = require('./main');
//#endregion

// app.js shall take care of all the initialization and module handling. 

main.init();

*/