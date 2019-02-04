'use strict';
/**
 * A user model which extends from the IDBRecord and implement all basic functionalities.
 * This could be used by SQL or no-sql databases.
 */

const AbstractModel = require("../framework/core/db/abstractmodel").AbstractModel;

let Model = class UserModel extends AbstractModel {

    constructor(config, store) {
        super(store);
        this.config.model = 'user';

        // Following are the fields available for the model.
        this.config.fields.name = "";
        this.config.fields.age = 0;
        this.config.fields.place = "";
        this.config.fields.content = "";

        this.init(config);
    };

    getIdField() {
        return "_id";
    };

};

Object.freeze(Model);

module.exports = Model; // Module exports for class UserModel.