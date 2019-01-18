/**
 * Main application file. Once application is getting started, it shall execute this file.
 * In some application, it might be index.js
 */
//#region What we require here, for developing application.

let config = require('./config');

/*
let Query = require('./data/dbquery').Query;

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
                "<" : {
                    "field1" : "100"
                }
            }
        }
    ]
};

let select = {
    "fields": ["field1", "field2","field3"]
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

let query = new Query("users", select,expObj,clauses);
console.error(query.convert());
console.log(query);

*/

console.log(config); // Let's see what does come out of it.



if (typeof (config.getConfig()) == "object") {

    // Initialise store manager and other necessay components, even before application starts.
    if (config.getStoreConfig() && config.getStoreConfig().length > 0) {
        console.error("Initializing store manager configurations from config.js");
        const StoreManager = require("./data/storemanager").StoreManager;
        StoreManager.getInstance().configure(config.getStoreConfig());
    }

    // Initialise model manager and other necessay components, even before application starts.
    if (config.getModelConfig() && config.getModelConfig().length > 0) {
        console.error("Initializing model manager configurations from config.js");
        const ModelManager = require("./data/modelmanager");
        ModelManager.getInstance().configure(config.getModelConfig());
    }


    console.log(config.getConfig());
    let runnable = require(config.getConfig().basePath + config.getConfig().js);
    runnable.init();
}

// To test if it gets committed to correct account.

/*
const main = require('./main');
//#endregion

// app.js shall take care of all the initialization and module handling. 

main.init();

*/