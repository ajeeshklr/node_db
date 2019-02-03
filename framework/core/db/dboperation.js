"use strict";

/**
 * This class contain the set of permissible operations possible in the framework.
 * Client may extend this code to provide additional functionslity.
 */


let DBOperation = class DBOperation {

    /**
     * 
     * @param {number} operation The databse operation which needs to be performed.
     * @param {AbstractModel} record An AbstractModel, which shall be executed against the databse.
     */
    constructor(operation, record) {
        if (typeof (operation) != 'number' || DB_OP.DB_OP_INVALID == operation || null == record) {
            throw new ArgumentException('Invalid operation specified.');
        }

        this.record = record;
        this.operation = operation;
    };

    getRecord() {
        return this.record;
    };

    getOperation() {
        return this.operation;
    };
};


/**
 * Container to hold list of DB operations permitted in the framework.
 */
let DB_OP = {};
DB_OP.DB_OP_INVALID = -1; // Represent invalid operation.
DB_OP.DB_OP_INSERT = 0; // Insert a new record.
DB_OP.DB_OP_READ = 1; // Read a particular record using the query provided.
DB_OP.DB_OP_UPDATE = 2; //  Update a record
DB_OP.DB_OP_DELETE = 3; // Delete record(s).
DB_OP.DB_OP_CREATE_TABLE = 4;
DB_OP.DB_OP_DROP_TABLE = 5;


exports.DB_OP = DB_OP;
exports.DBOperation = DBOperation;