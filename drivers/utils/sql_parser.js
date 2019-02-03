let DbQuery = require('../../framework/core/db/dbquery').Query;
let AbstractModel = require('../../framework/core/db/abstractmodel').AbstractModel;

let Container = {};

Container.convertToUpdateQuery = function (updateObject) {
    if (updateObject) {

        if (updateObject.collection) {
            // Check to see if the model object or AbstractModel instance is valid.
            if (!updateObject.model || !updateObject.criteria) {
                console.error("Invalid update model.");
                return null;
            }

            let update = {};

            if (updateObject.model instanceof AbstractModel) {
                update["set"] = updateObject.model.getUpdatorConfig();
            } else if (typeof (updateObject.model) == "object") {
                update["set"] = updateObject.model.set;
            }


            // Criteria might have the following.
            // "filter" - for any filters
            // clause for any clauses.

            Object.keys(updateObject.criteria).forEach(element => {
                switch (element) {
                    case "filter":
                        update["filter"] = updateObject.criteria.filter;
                        break;
                    case "clause":
                        update["clause"] = updateObject.criteria.clause;
                        break;
                }
            });

            try {
                let dbquery = new DbQuery(updateObject.collection, update.set, update.filter, update.clause);
                let queryString = dbquery.toUpdate(); // Convert to query object.
                dbquery = null;
                update = null;
                return queryString;

            } catch (error) {
                console.error(error);
                return null;
            }


        } else {
            console.error("Invalid updateObject received. Collection name is not present in updateObject.")
            return null;
        }

    } else {
        console.error("Invalid updateObject received.");
        return null;
    }
}

Container.convertToInsertQuery = function (model) {
    let fields = model.getFields();
    let values = [];
    fields.forEach(key => {
        values.push(model.get(key));
    });

    let select = {
        "fields": fields,
        "values": values
    }

    let dbq = new DbQuery(model.modelName(), select);
    let query = dbq.toInsert();
    select = null;
    values = null;
    return query;

}

Container.convertToDeleteQuery = function (model) {

    let deleteConfig = {};
    if (model instanceof AbstractModel) {
        deleteConfig[model.getIdField()] = model.getId();
    } else {
        deleteConfig = model;
    }

    let query = new DbQuery("users", deleteq, null, null);
    let queryString = query.toDelete();
    query = null;
    deleteConfig = null;
    return queryString;
}

module.exports = Container;