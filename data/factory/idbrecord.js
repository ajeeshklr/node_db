"use strict";

/**
 * This class is the base framework class for a particular DB record.
 * DB Manager shall be using this to perform particular DB operations.
 * Client shall extend from this base class and provide custom implemetations based on the underlying databse.
 */

let IDBRecord = class IDBRecord {

    constructor() {
        this.documentName = ''; // String for the document name, this is analogus to the table name in sql.
        this.fields = ['']; // Document fields, which shall be modified by the derived class model.
        this.values = {};
    }

    getDocumentName() { return this.documentName; };
    getFields() { return this.fields; };
    getValues() { return this.values; };

    /**
     *  Convert the IDBRecord instance to string.
     */
    toString() {
        var jsonObject = this.toJSON();
        return JSON.stringify(jsonObject);   // This shall convert the JSON to string.
    };

    /**
     * Convert the IDBRecord instance to JSON object.
     */
    toJSON() {

        var jsonObject = {};
        jsonObject.documentName = this.getDocumentName();
        jsonObject.fields = {};
        for (var field in this.getFields()) {
            var fieldName = this.getFields()[field];
            jsonObject.fields[fieldName] = this.getValues()[fieldName];
        }
        return jsonObject;

    };

};

exports.IDBRecord = IDBRecord;
