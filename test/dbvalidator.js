"using strict";
/**
 * Validator for the DB operations.
 * This class shall be modified to perform any DB validations.
 * This class shall have validations of a particular DB type.
 * DB executions can be synchronous/hronous.
 * Implementor shall make sure that the functions are synchrnous ( even though DB call can be hronous )
 * Proper await mechanism shall be used inorder to make the functions synchronous.
 */

let container = {}; // Container to hold validators.

/**
 * DB configuration for the DB validator.
 * This can either be pulled from application DB configuration or a 
 */

// Let's require the framework first.
let DBManager = require('../framework/managers/dbmanager').DbManager;
let DBOperation = require('../framework/core/db/dboperation').DBOperation;
let DB_OP = require('../framework/core/db/dboperation').DB_OP;
let config = require('../config').getConfig();
let co = require('co');
let StoreManager = require('../framework/managers/storemanager').StoreManager;



let insert = async function (callback) {

    let UserModel = require("../model/usermodel");

    let userconfig = {
        "name": "Ajeesh B Nair",
        "age": 35,
        "place": "Kalanjoor",
        "content": fileContent
    };

    var instance = new UserModel(userconfig);
    // instance.beginInit();
    // instance.set('name', 'Ajeesh B Nair');
    // instance.set('age', 35);
    // instance.set('place', 'Kalanjoor');
    // instance.endInit();

    instance.on('add', (obj) => {
        instance.cleanup();
        callback(null, obj);
    });
    instance.on('error', (message) => {
        instance.cleanup();
        callback(message);
    });
    instance.save();

    /*

    
    let p = StoreManager.getInstance().get("user").add(instance);
    p.then(res => {
        callback(null, res);
    }).catch(err => {
        callback(err);
    });*/

    UserModel = null;

};


let find1 = function (callback) {

    let criteria = {
        "filter": {
            "config.fields.name": "Ajeesh B Nair"
        },
        "clause": {
            "limit": 1
        }
    }

    let p = StoreManager.getInstance().get("user").find(criteria, null, false);
    if (p) {
        p.then(res => {
            callback(null, res);
        }).catch(err => {
            callback(err);
        });
    }


};


let update = function (callback) {

    let criteria = {
        "collection": "user",
        "filter": {
            "config.fields.name": "Ajeesh B Nair"
        },
        "clause": {
            "multi": true,
            "limit": 1
        }
    };

    // Find a model which has the name and age matching.
    let p = StoreManager.getInstance().get("user").find(criteria);
    if (p) {
        p.then(res => {
            if (res.length > 0) {
                let record = res[0];
                let UserModel = require("../model/usermodel");
                let user = new UserModel(record.config.fields);
                user.setId(record[user.getIdField()]);

                let updateFn = function (obj, config, pattern) {
                    this.cleanup();
                    callback(null, this);
                };

                user.on("update", updateFn);
                user.on("add", updateFn);

                user.set('name', "Ajeesh!!!!!!");
                user.set('location', 'Bangalore');

                user.save();

            }
        }).catch(err => {
            callback(err);
        });
    }



    // let p = StoreManager.getInstance().get("user").update(updateConfig, criteria);
    // p.then(res => {
    //     // res.forEach(result => {
    //     //     console.log(result);
    //     // });
    //     console.log("Updated. Total records matching the new query is " + res.length);
    //     callback(null, res);
    // }).catch(err => {
    //     callback(err);
    // });
};

let find2 = function (callback) {

    let criteria = {
        "filter": {
            "or": {
                "config.fields.name": "Sreevidhya K V",
                "config.fields.age": 34,
                "config.fields.place": "Kalady"
            }
        }
    };
    /*
        let criteria = {
            "filter": {
                "or": [{
                        "config.fields.name": "Sreevidhya K V"
                    },
                    {
                        "config.fields.age": 34
                    },
                    {
                        "config.fields.place": "Kalady"
                    }
                ]
            }
        }*/

    let p = StoreManager.getInstance().get("user").find(criteria, null, false);
    p.then(res => {
        callback(null, res);
    }).catch(err => {
        callback(err);
    });

};
/*
container.delete = function (callback) {

    var manager = DBManager.getInstance();

    // Let's use generators here as we are going to use promises.
    co(function* () {
        let db = yield manager.configure(config);
        if (!db) {
            callback(new Error('Internal server error. Could not connect to DB driver.'));
            return;
        }
        let dbinstance = yield manager.openDatabase();
        if (dbinstance && dbinstance.databaseName && dbinstance.databaseName == config.database.name) {
            let am = require('../data/factory/model/abstractmodel').AbstractModel;
            var model = new am();
            model.config.model = 'user';
            var operation = new DBOperation(DB_OP.DB_OP_DELETE, model);
            manager.execute(operation, callback);
        }
    }).catch(err => {
        console.log(err);
        callback(err);
    });

};
*/

container.insert = insert;
// container.find1 = find1;
// container.update = update;
// container.find2 = find2;

module.exports = container;