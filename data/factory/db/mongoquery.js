"use strict";

let Query = require('../../dbquery').Query;
let Expression = require('../../queryexpression').Expression;
let QueryExpression = require('../../queryexpression').QueryExpression;

let OperatorMap = {
    "<": "$lt",
    ">": "$gt",
    "<=": "$lte",
    ">=": "$gte",
    "=": "$eq",
    "!=": "$ne",
    "and": "$and",
    "or": "$or",
    "set": "$set"
};

let MongoQuery = class MongoQuery extends Query {

    prepareExpression(expression, queryObject, appendOperator = true) {
        if (expression) {
            if (Object.prototype.toString.call(expression) == "[object Array]") {


                // We have some valid expressions to select from.
                expression.forEach(element => {
                    if (element.isCompositeExpression()) { // If it is a composite expression
                        let inter = [];
                        this.__convertInternal(inter, element, appendOperator);
                        queryObject["$" + element.getOperator()] = inter;
                    } else {
                        let operands = element.operands[0]; // this is an array
                        if (appendOperator) {
                            let opm = OperatorMap[element.getOperator()];
                            let opmVal = {};


                            if (typeof (operands[1]) == "string") {
                                opmVal[opm] = "" + operands[1];
                            } else {
                                opmVal[opm] = operands[1];
                            }

                            queryObject[operands[0]] = opmVal;
                        } else {
                            queryObject[operands[0]] = typeof (operands[1]) == "string" ?
                                "" + operands[1] :
                                operands[1];
                        }

                    }
                });
            } else {
                Object.keys(expression).forEach(key => {
                    queryObject.key = expression[key];
                })
            }
        }
    }

    toSelect() {

        // Perform the conversion logic for MongoQuery.
        // User can modify this to match any requirement.
        // Idea is to receive a query object, which complies to MongoDb standard.

        let queryObject = {};
        this.prepareExpression(this._expression.getExpression(), queryObject);


        if (this._clauses) { // Mainly contains sort order and limit. Not sure if it is supported alreay.

        }

        return queryObject;
    };

    toUpdate() {

        let queryObject = {};
        queryObject.filter = {};
        this.prepareExpression(this._expression.getExpression(), queryObject.filter);

        let update = {};
        queryObject.update = {};
        let selectExp = new QueryExpression(this._select);
        if (selectExp.isValidExpression()) {
            this.prepareExpression(selectExp.getExpression(), update, false);
        }

        queryObject.clause = this._clauses || {};
        if (queryObject.clause.multi || queryObject.clause.upsert) {
            queryObject.update = {
                "$set": update
            };
        } else {
            queryObject.update = update;
        }


        return queryObject;

    };

    __convertInternal(elements, compositeElement, appendOperator) {

        let operands = compositeElement.getOperands()[0];
        operands.forEach(element => {

            if (Object.prototype.toString.call(element) == "[object Array]") {
                element = element[0];   // It could be an array also.
            }

            /* if (Object.prototype.toString.call(element) == "[object Array]") { */
            if (element.isCompositeExpression()) {
                let nestedElements = [];
                this.__convertInternal(nestedElements, element, appendOperator);
                elements.push(nestedElements);
            } else {

                let operands = element.operands[0]; // this is an array
                let singleElement = {};
                if (appendOperator) {
                    let opm = OperatorMap[element.getOperator()];
                    let opmVal = {};


                    if (typeof (operands[1]) == "string") {
                        opmVal[opm] = "" + operands[1];
                    } else {
                        opmVal[opm] = operands[1];
                    }

                    singleElement[operands[0]] = opmVal;
                } else {
                    singleElement[operands[0]] = typeof (operands[1]) == "string" ?
                        "" + operands[1] :
                        operands[1];
                }

                elements.push(singleElement);
            }
        });
    };
}

exports.MongoQuery = MongoQuery;