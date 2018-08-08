'use strict';
/**
 * A user model which extends from the IDBRecord and implement all basic functionalities.
 * This could be used by SQL or no-sql databases.
 */

 const AbstractModel = require( "../data/factory/model/abstractmodel" ).AbstractModel;

 let UserModel = class UserModel extends AbstractModel {
  
    constructor(config){
        super();
        this.config.model = 'user';

        // Following are the fields available for the model.
        this.config.fields.name = "";
        this.config.fields.age = 0;
        this.config.fields.place = "";

        this.init(config);
    };

    getIdField() {
        return "id";
    };

 };

 module.exports = UserModel; // Module exports for class UserModel.