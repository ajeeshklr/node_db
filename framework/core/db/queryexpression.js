"use strict;"

const __supported_operands = ['and', 'or', "<", ">", "<=", ">=", "=", "!=", "__op", "set"];
const configPart = 'config.fields.';

const Expression = class Expression {

    constructor(operator, ...operands) {

        this.operator = operator;
        this.operands = operands;
    };


    __join(operands, omitOperator = false, simpleSql) {
        var expressionString = "";
        var expanded = this.__expand(operands, simpleSql);

        expanded.forEach((element, index, array) => {
            if (element instanceof Expression) {
                expressionString += " " + element.toString();
            } else if (Object.prototype.toString.call(element) == "[object Array]") {
                expressionString += this.__join(element, omitOperator, simpleSql);
            } else {
                expressionString += " " + element;
            }
            if (!omitOperator) {
                if (index < operands.length - 1) {
                    expressionString += " " + this.operator;
                }
            }
        }, this);

        return expressionString;
    };

    toString(simpleSql) {
        var expressionString = "";
        switch (this.operator) {

            case "and":
            case "or":

                expressionString = this.__join(this.operands, false, simpleSql);

                expressionString = "(" + expressionString + ")";
                break;
            case "set":
                //  TODO Need to support complex queries later.
                // Support simple query now.
                expressionString = this.__join(this.operands, true, simpleSql);
                expressionString = "SET ( " + expressionString + " )";

                break;

            default:
                let tempExp = '';
                this.operands.forEach(value => {
                    if (tempExp.length > 0) {
                        tempExp += ',';
                    }
                    // value is an array
                    if (Object.prototype.toString.call(value) == "[object Array]") {
                        if (simpleSql) {
                            // Value is an array with two elements.
                            // value[0] is key.
                            let val = value[0].startsWith(configPart) ? value[0].substr(configPart.length) : value[0]

                            tempExp += "(" + val + " " + this.operator + " " + (typeof (value[1]) != 'string' ? value[1] : "\'" + value[1] + "\'") + ")";
                        } else {
                            tempExp += value.join(" " + this.operator + " ");
                        }
                    }
                });
                expressionString += tempExp;
                break;

        }

        return expressionString;
    };

    __expand(array, simpleSql) {
        let expanded = [];
        array.forEach(element => {
            if (Object.prototype.toString.call(element) == "[object Array]") {
                if (element.length > 0) {
                    let exp = this.__expand(element, simpleSql);
                    if (exp.length > 0) {
                        expanded.push(exp);
                    }
                }
            } else {
                expanded.push(element.toString(simpleSql));
            }
        });

        return expanded;
    };

    isCompositeExpression() {
        return this.operator == "and" || this.operator == "or";
    };

    getOperator() {
        return this.operator;
    }
    getOperands() {
        return this.operands;
    }

};

let QueryExpression = class QueryExpression {

    constructor(expression) {
        if (null == expression || (typeof (expression) == 'object' && typeof (expression) == "array")) {
            throw new Error("Invalid expression specified. Please check the documentation for the expression format.");
        }

        let parsed = this.parse(expression);

        if (null != parsed && this.isValidExpression(parsed)) {
            this._expression = expression;
            this.parsedExpression = parsed;
        } else {
            parsed = null;
        }
    };

    parse(expression) {

        var exptype = typeof (expression);
        let parsedExp = null;
        if (exptype == "string") { // Only possibiliy where string type for operation is when we set "limit". Ex. "limit" : "50"

            try {
                var jsonObject = JSON.parse(expression);
                parsedExp = new Expression(jsonObject);
            } catch (error) {
                console.error(error);
                return false;
            }
        } else {
            if (Object.prototype.toString.call(expression) == "[object Array]") {
                // Only one entry is possible, and would be for update query.
                parsedExp = this.__parseExpression(expression[0]);
            } else {
                parsedExp = this.__parseExpression(expression);
            }
        }

        return parsedExp;
    };

    isValidExpression(exp) {

        var parsedExpression = exp || this.parsedExpression;

        if (null == parsedExpression) {
            return false;
        }

        // Expression shall be a simple expression or composite expression.
        // In the case of composite expression, parsedExpression is an array
        if (parsedExpression instanceof Expression) {
            return true;
        } else if (Object.prototype.toString.call(parsedExpression) == "[object Array]") {
            var compositeExp = 0;
            // In case you have composite expression, you are not supposed to have an orphan expression.
            parsedExpression.forEach(element => {
                if (element.isCompositeExpression()) {
                    compositeExp = (compositeExp | 1) & 3;
                } else {
                    compositeExp = (1 << 1 | compositeExp) & 3;
                }
            });

            if (compositeExp == 3) {
                // Means presence of both composite and simple expressions
                console.error("Presence of both composite and generic expressions. Orphan expressions have to be removed. Please revisit the expression. You can print the output of the expression to understand it better..");
                return false;
            } else if (compositeExp == 0) {
                // Means presence of both composite and simple expressions
                console.error("Invalid expression or no valid expression object passed to the function. Check the input query expression and modify accordingly.");
                return false;
            }

            return true;
        } else {
            // Invalid expression or it is not detected.
            return false;
        }
    };

    toString(simpleSql = false, stringJoin = " AND ") {

        var str = "";
        if (this.isValidExpression()) {
            this.parsedExpression.forEach((exp) => {
                if (str.length > 0) {
                    str += stringJoin;
                }
                str += exp.toString(simpleSql);
            });
        }

        return str;
    };

    __parseExpression(expression) {

        let exp = [];
        let expressionString = "";
        let keys = Object.keys(expression);
        let array = Object.values(expression);
        for (var index = 0; index < keys.length; index++) {
            var value = keys[index];

            if (typeof (value) == "string") {
                if (__supported_operands.indexOf(value.toLowerCase()) >= 0) {
                    switch (value.toLowerCase()) {

                        case "and":
                        case "or":
                            {
                                if (Object.prototype.toString.call(expression[value]) == "[object Array]") {
                                    // Array, so let's split it and append to the string.
                                    let splittedExpression = this.__splitExpression(expression[value]);
                                    if (splittedExpression.length <= 1) {
                                        console.error("Can't perform %s on single element.", value.toLowerCase());
                                    }
                                    var tempExp = new Expression(value.toLowerCase(), splittedExpression);
                                    exp.push(tempExp);

                                } else if (typeof (expression[value]) == "object") {
                                    let tempExp = this.__parseExpression(expression[value]);
                                    if (tempExp.length <= 1) {
                                        console.error("Can't perform %s on single element.", value.toLowerCase());
                                    }
                                    exp.push(new Expression(value.toLocaleLowerCase(), tempExp));
                                    //       console.log(JSON.stringify(tempExp));
                                }

                            }
                            break;
                        case "__op":
                            if (index == 0 /* Should be the first index */ ) {
                                exp.push(new Expression(expression[value], [keys[1], array[1]]));
                                return exp; // Break the execution from here, as it is expected to have binary operators.
                            }
                            break;
                        case "<":
                        case ">":
                        case "<=":
                        case ">=":
                        case "=":
                        case "!=":

                            var val = expression[value];
                            if (typeof (val) != "object") {
                                console.error("Invalid expression. Expecting object for %s. Received %s ", value, typeof (val));
                            }

                            // All these are binary operation. Here in this object, it is in key-value pair.
                            // It will be like { field : value }
                            // Check if object has exactly one key
                            if (Object.keys(val).length != 1) {
                                console.error("Invalid object specified in the expression. Expected binary operands. Expression - Operator : %s, Operands - %s ", value, val);
                            }

                            var key = Object.keys(val)[0];
                            exp.push(new Expression(value, [key, val[key]]));

                            break;

                        default:

                            // Shall be in key-value pair. It is always comparision operations.
                            exp.push(new Expression("=", [value, expression[value]]));

                            break;

                    }
                } else {
                    // Shall be in key-value pair. It is always comparision operations.
                    exp.push(new Expression("=", [value, expression[value]]));
                }
            }
        }

        return exp;
    };

    __splitExpression(array) {
        let arr = [];

        array.forEach(element => {
            if (typeof (element) == "object") {
                let parsedExp = this.__parseExpression(element);
                if (parsedExp.length > 0) {
                    arr.push(parsedExp);
                }
            } else {
                console.error("Object expected instead %s received. Element - %s", typeof (element), element);
                throw new Error("Object expected instead " + typeof (element) + " received.");
            }
        });

        return arr;
    };

    getExpression() {
        return this.parsedExpression;
    }
};

exports.Expression = Expression; // Expression prototype. This is useful only when convert is used in DbQuery.
exports.QueryExpression = QueryExpression; // Query expression prototype.