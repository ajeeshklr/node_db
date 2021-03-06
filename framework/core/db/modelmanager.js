"use strict";

/**
 * ModelManager retrieves the model instance once it is created.
 * models are created dynamically once the application is loaded.
 * This is a singletone class and shall contain only one instance of a particular model.
 */


/**
 * Singleton instance for the model manager.
 */
let _singletonInstance = null;

let ModelManager = class ModelManager {
    constructor() {
        if (!ModelManager._init) {
            throw new Error("Could not instantiate a singleton class. Use the static methods instead.");
        }

        console.error('Initializing model manager.');
        this._models = {}; // List of models in the ModelManager.
    };

    static getInstance() {
        if (null == _singletonInstance) {
            ModelManager._init = true;
            _singletonInstance = new ModelManager();
            ModelManager._init = false;
        }

        return _singletonInstance;
    };

    get(model) {
        if (null == model || null == this._models) {
            return null;
        }

        if (Object.keys(this._models).indexOf(model) >= 0) {
            return this._models[model];
        }

        return null;
    };

    /**
     * 
     * @param {JSON} modelsConfig models defined in the application file.
     * The model configurations are modeld in app.json under model config section.
     */
    configure(modelsConfig, env) {
        if (null == modelsConfig || modelsConfig.lengh == 0) {
            return;
        }

        modelsConfig.forEach(modelsCfg => {

            if (Object.keys(this._models).indexOf(modelsCfg.name) < 0) {

                try {
                    let path = require('path');
                    let processPath = process.cwd(); // Current working path of the node.js process.
                    let modelPath = path.resolve(processPath, modelsCfg.path);

                    var find = '{envName}';
                    let schemaLocation = (modelsCfg.schema && modelsCfg.schema.length > 0 ? modelsCfg.schema : '').replace(find, env.envName);
                    let schemaPath = path.resolve(processPath, schemaLocation);
                    console.info("model path - " + modelPath);
                    let model = require(modelPath);
                    if (schemaPath.length > 0) {
                        try {
                            console.info("schema path - " + schemaPath);

                            let schema = require(schemaPath);
                            model.prototype.sqlSchema = schema.sqlSchema;
                            model.prototype.jsonSchema = schema.jsonSchema;
                        } catch (ex) {
                            console.error(ex);
                        }

                    }
                    this._models[modelsCfg.name] = model;
                    modelPath = null;

                } catch (err) {
                    console.error(err);
                }

            }

        });
    }
};

module.exports = ModelManager; // Exports specific type to the outside world.