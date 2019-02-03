"use strict";

/**
 * StoreManager retrieves the store instance once it is created.
 * Stores are created dynamically once the application is loaded.
 * This is a singletone class and shall contain only one instance of a particular store.
 */


/**
 * Singleton instance for the store manager.
 */
let _singletonInstance = null;
let DbManager = require('./dbmanager').DbManager;

let StoreManager = class StoreManager {
    constructor() {
        if (!StoreManager._init) {
            throw new Error("Could not instantiate a singleton class. Use the static methods instead.");
        }

        console.error('Initializing store manager.');
        this._stores = {}; // List of stores in the StoreManager.
    };

    static getInstance() {
        if (null == _singletonInstance) {
            StoreManager._init = true;
            _singletonInstance = new StoreManager();
            StoreManager._init = false;
        }

        return _singletonInstance;
    };

    get(store) {
        if (null == store || null == this._stores) {
            return null;
        }

        if (Object.keys(this._stores).indexOf(store) >= 0) {
            return this._stores[store];
        }

        return null;
    };

    /**
     * 
     * @param {JSON} storesConfig Stores defined in the application file.
     * The store configurations are stored in app.json under store config section.
     */
    configure(storesConfig) {
        if (null == storesConfig || storesConfig.lengh == 0) {
            return;
        }

        storesConfig.forEach(storesCfg => {

            if (Object.keys(this._stores).indexOf(storesCfg.name) < 0) {

                try {
                    let path = require('path');
                    let processPath = process.cwd(); // Current working path of the node.js process.
                    let storePath = path.resolve(processPath, storesCfg.path);
                    console.info("Store path - " + storePath);
                    let store = require(storePath).Store;
                    var storeInstance = new store();
                    storeInstance.database = DbManager.getInstance().getDatabase();
                    this._stores[storesCfg.name] = storeInstance;

                } catch (err) {
                    console.error(err);
                }

            }

        });
    }
};

exports.StoreManager = StoreManager; // Exports specific type to the outside world.