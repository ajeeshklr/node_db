let Container = {};

Container.init = function (config) {
    return new Promise((resolve, reject) => {

        if (typeof (config.getConfig()) == "object") {

            const dbmanager = require('./managers/dbmanager').DbManager;
            dbmanager.getInstance().configure(config.getConfig()).then((res) => {
                if (res) {
                    dbmanager.getInstance().openDatabase().then((db) => {

                        // Initialise model manager and other necessay components, even before application starts.
                        if (config.getModelConfig() && config.getModelConfig().length > 0) {
                            console.error("Initializing model manager configurations from config.js");
                            const ModelManager = require("./core/db/modelmanager");
                            ModelManager.getInstance().configure(config.getModelConfig(), config);

                            if (dbmanager.getInstance().getDatabase().getDatabaseType() == 'sql') {
                                // Execute schema against the database, if needed.
                                // Which is needed only if database is of 'sql' type.
                                config.getModelConfig().forEach(async modelsCfg => {
                                    try {
                                        var m = ModelManager.getInstance().get(modelsCfg.name);
                                        if (m) {
                                            var result = await dbmanager.getInstance().getDatabase().executeStatement(m.prototype.sqlSchema);
                                            if (result) {
                                                console.log(result);
                                            }
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    }
                                });
                            }

                        }

                        // Initialise store manager and other necessay components, even before application starts.
                        if (config.getStoreConfig() && config.getStoreConfig().length > 0) {
                            console.error("Initializing store manager configurations from config.js");
                            const StoreManager = require("./managers/storemanager").StoreManager;
                            StoreManager.getInstance().configure(config.getStoreConfig());
                        }



                        // Let's send this back to caller, so that they can get the current DB and perform DB operations.
                        resolve(dbmanager);

                    }).catch((err) => {
                        reject(err);
                    })
                } else {
                    reject("Failed to configure DB manager.");
                }
            }).catch(err => {
                console.error(err);
                reject(err);
            });

        } else {
            reject("Invalid configuration.");
        }

    });
};

module.exports = Container;