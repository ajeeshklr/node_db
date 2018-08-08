"use strict;"

let QueryExpression = require('./queryexpression').QueryExpression;
let Expression = require('./queryexpression').Expression;

let Query = class DBQuery {

    /**
     * @param {string} collection Name of the collection on which the selection needs to be performed. This is similar to the table in SQL.
     * @param {object} select Select statement. Pass null if all fields needs to be selected
     * @param {object} expressionObject Expression object, for additional clauses for filter criteria. This is analogous to the WHERE clause in SQL query.
     * @param {object} clauses Additional clauses. Possible values are "Sort" order and "limit"
     * @description 
     *  Possble valuse for select / update field 
     *  null or 
                {
                    "fields" : ["field1","field2",....."fieldn"]
                }

                or

                {
                    "fields" : "*"
                }

                or for update.
                {
                    "set" : [
                        {
                            "field1" : "value1"
                        },
                        {
                            "field2" : "value2"
                        }
                    ]
                }

                or for insert
                {
                    "fields" : ["field1","field2"...."fieldn"],
                    "values" : ["value1,"value2"...."valuen"]
                }

                or for CREATE_TABLE
                {
                    "fields" : [
                        {

                        },
                        {

                        }
                    ],
                    "config" : {
                        "PRIMARY KEY" : "id"
                    }
                }
     * 
     *  Possible values for clauses for select
     *
     * [    
           {
                "sort": [{
                    "field": "field1",
                    "order": "asc"
                }, {
                    "field": "field2",
                    "order": "desc"
                }]
            },
            {
                "limit" : 100
            }
        ]

        For update, the clauses can have the following information and need not be valid for all databases. 
        For example - The below clauses are valid for MongoDB update operation.
        {
            upsert: < boolean > ,
            multi: < boolean > ,
            writeConcern: < document > ,
            collation: < document > ,
            arrayFilters: [ < filterdocument1 > , ...]
        }

        As there is no generic way to support this, it is up to the programmers to use it wisely. 
        Driver developers might need to define a standard notation which satisfies most of the db drivers.

        SQL like database need not have the above clause notation as it does uses the filter and set to update the document.

     */
    constructor(collection, select, expressionObject, clauses) {

        if (!collection || typeof (collection) != "string") {
            throw new Error("Invalid collection name provided in the DbQuery.");
        }

        this._collection = collection;

        if (null != expressionObject) {
            // Construct expression object first.
            let expression = new QueryExpression(expressionObject);
            if (expression.isValidExpression()) {
                this._expression = expression;
            }
        } else {
            // No expression or additional WHERE clauses.
            this._expression = null;
        }

        this._select = select || null;

        this._clauses = clauses || null;

    };

    /**
     * A function, which should be overidden in the derived classes corresponding to the underlying databse to 
     * convert the DB query corresponds to the underlying DB driver.
     * 
     * @returns An SQL like select query.
     */
    toSelect() {

        let selectQ = "";

        if (this._select == null || (this._select.fields != null &&
                typeof (this._select["fields"]) == "string" && this._select["fields"] == "*")) {
            selectQ = "SELECT * FROM " + this._collection;
        } else if (this._select != null && this._select.fields != null && Object.prototype.toString.call(this._select["fields"]) == "[object Array]") {
            var temp = this._select["fields"].join();
            selectQ = "SELECT " + temp + " FROM " + this._collection;
        } else {
            throw new Error("Invalid select config. Please check the select config. " + JSON.stringify(this._select));
        }


        if (this._expression) {
            selectQ += " WHERE (" + this._expression.toString(true) + ")";
        }

        if (this._clauses) {

            let cl = "";
            let parseClause = function (clause) {
                if (typeof (clause) != "object") {
                    throw new Error("Invalid clause provided in the query.");
                }


                let keys = Object.keys(clause);
                if (keys.indexOf("sort") >= 0) {
                    // This has sort clause.
                    let sortClauses = clause["sort"];
                    if (null != sortClauses && sortClauses.length > 0) {
                        let sorties = [];
                        for (var i = 0; i < sortClauses.length; i++) {
                            sorties.push(sortClauses[i]["field"] + " " + sortClauses[i]["order"] + ";");
                        }

                        cl += " ORDER BY " + sorties.join(" THEN BY ");
                    }
                }

                if (keys.indexOf("limit") >= 0) { // This has limit clause.
                    if (cl.length > 0) {
                        cl += " " + "limit " + clause["limit"] + ";";
                    } else {
                        cl = "limit " + clause["limit"] + ";";
                    }
                }
            };
            if (Object.prototype.toString.call(this._clauses) == "[object Array]") {
                this._clauses.forEach(clause => {
                    parseClause(clause);
                });
            } else if (typeof (this._clauses) == 'object') {
                parseClause(this._clauses);
            }


            if (cl.length > 0) {
                selectQ += " " + cl;
            }
        }

        // console.error(selectQ);

        return selectQ;
    };

    /**
     * Prepare an update query object for the DB query provided.
     * 
     * @returns By default, returns an update query for SQL database.
     */
    toUpdate() {
        if (!this._select) {
            throw new Error("Invalid update clause query.");
        }

        var sql = "UPDATE " + this._collection + " ";
        let updateExpression = new QueryExpression(this._select);
        sql += "SET " + updateExpression.toString(true);
        if (this._expression) {
            sql += " WHERE " + this._expression.toString(true);
        }

       //  console.error(sql);
        return sql;
    };


    /**
     * Prepare an insert query to insert into the table.
     * 
     * @returns A valid SQL query to be inserted into the SQL database.
     */
    toInsert() {
        if (this._select == null ||
            (this._select.fields && Object.prototype.toString.call(this._select.fields) != "[object Array]") ||
            !this._select.values || Object.prototype.toString.call(this._select.values) != "[object Array]" ||
            this._select.values.length == 0) {
            throw new Error("Expression passed to insert is invalid. Check the select clause and it's properties.");
        }
        let insertQuery = "INSERT INTO " + this._collection + " ";
        if (this._select.fields && this._select.fields.length > 0) {
            var subQuery = "";
            this._select.fields.forEach(field => {
                if (subQuery.length > 0) {
                    subQuery += ",";
                }
                subQuery += field;
            });

            subQuery = "(" + subQuery + ")";
        }

        insertQuery += subQuery + " ";

        subQuery = "";
        this._select.values.forEach(value => {
            if (subQuery.length > 0) {
                subQuery += ",";
            }

            switch (typeof (value)) {
                case 'boolean':
                case 'number':
                    subQuery += value;
                    break;
                case "string":
                    subQuery += '\'' + value + '\'';
                    break;
                default:
                    subQuery += value; //TODO  Need to find out possible datatypes here.
                    break;
            }
        });

        subQuery = " VALUES (" + subQuery + ")";

        insertQuery += subQuery;

        return insertQuery;

    };

    toDelete() {

    }
};

exports.Query = Query;