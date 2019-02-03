let Query = require('../framework/core/db/dbquery').Query;
let MongoQuery = require("../drivers/mongo/mongoquery").MongoQuery;

testSelectQueryComplex = function () {
    let expObj = {
        "or": [{
                "and": [{
                        __op: "==",
                        "field1": "value1"
                    },
                    {
                        __op: "!=",
                        "field2": "value2"
                    },
                    {
                        __op: "<",
                        "field3": "value3"
                    },
                    {
                        __op: ">",
                        "field4": "value4"
                    }
                ]
            },
            {
                "or": {
                    "and": [{
                            __op: "==",
                            "field5": "value5"
                        },
                        {
                            __op: "!=",
                            "field6": "value6"
                        }
                    ],
                    "<": {
                        "field1": "100"
                    }
                }
            }
        ]
    };

    let select = {
        "fields": ["field1", "field2", "field3"]
    };

    let clauses = [{
            "sort": [{
                "field": "field1",
                "order": "asc"
            }, {
                "field": "field2",
                "order": "desc"
            }]
        },
        {
            "limit": 100
        }
    ];

    let query = new Query("users", select, expObj, clauses);
    console.log(query.toSelect());
    console.log(query);

    let mongoQ = new MongoQuery("users", select, expObj, clauses);
    console.log(mongoQ.toSelect());
    console.log(mongoQ);
}


testSelectQuerySimple = function () {

    let expObj = {
        "or": {
            "field1": "value1",
            "field2": "value2"
        }
    };

    let select = {
        "fields": ["field1", "field2", "field3"]
    };

    let clauses = [{
            "sort": [{
                "field": "field1",
                "order": "asc"
            }, {
                "field": "field2",
                "order": "desc"
            }]
        },
        {
            "limit": 100
        }
    ];

    let query = new Query("users", select, expObj, clauses);
    console.log(query.toSelect());
    console.log(query);

    let mongoQ = new MongoQuery("users", select, expObj, clauses);
    console.log(mongoQ.toSelect());
    console.log(mongoQ);

}

testUpdateQueryComplex = function () {

    let expObj = {
        "or": [{
                "and": [{
                        __op: "==",
                        "field1": "value1"
                    },
                    {
                        __op: "!=",
                        "field2": "value2"
                    },
                    {
                        __op: "<",
                        "field3": "value3"
                    },
                    {
                        __op: ">",
                        "field4": "value4"
                    }
                ]
            },
            {
                "or": {
                    "and": [{
                            __op: "==",
                            "field5": "value5"
                        },
                        {
                            __op: "!=",
                            "field6": "value6"
                        }
                    ],
                    "<": {
                        "field1": "100"
                    }
                }
            }
        ]
    };

    let update = {

        "field1": "value1",
        "field2": "value2",
        "field3": "value3"

    };

    let clauses = [{
            "sort": [{
                "field": "field1",
                "order": "asc"
            }, {
                "field": "field2",
                "order": "desc"
            }]
        },
        {
            "limit": 100
        }
    ];

    let query = new Query("users", update, expObj, clauses);
    console.log(query.toUpdate());
    console.log(query);

    let mongoQ = new MongoQuery("users", update, expObj, clauses);
    console.log(mongoQ.toUpdate());
    console.log(mongoQ);
}

testUpdateQuerySimple = function () {

    let expObj = {
        "or": {
            "field1": "value1",
            "field2": "value2"
        }
    };

    let update = {

        "field1": "value1",
        "field2": "value2",
        "field3": "value3"

    };

    let clauses = [{
            "sort": [{
                "field": "field1",
                "order": "asc"
            }, {
                "field": "field2",
                "order": "desc"
            }]
        },
        {
            "limit": 100
        }
    ];

    let query = new Query("users", update, expObj, clauses);
    console.log(query.toUpdate());
    console.log(query);

    let mongoQ = new MongoQuery("users", update, expObj, clauses);
    console.log(mongoQ.toUpdate());
    console.log(mongoQ);
}


testInsertQuery = function () {

    let insert = {
        "fields": ["field1", "field2"],
        "values": ["value1,value2"]
    };


    let query = new Query("users", insert, null, null);
    console.log(query.toInsert());
    console.log(query);

    let mongoQ = new MongoQuery("users", insert, null, null);
    console.log(mongoQ.toInsert());
    console.log(mongoQ);
}

testDeleteQuery = function () {

    let deleteq = {

        "field1": "value1",
        "field2": "value2",
        "field3": "value3"

    };


    let query = new Query("users", deleteq, null, null);
    console.log(query.toDelete());
    console.log(query);

    let mongoQ = new MongoQuery("users", deleteq, null, null);
    console.log(mongoQ.toDelete());
    console.log(mongoQ);
}

testDeleteComplexQuery = function () {

    let expObj = {
        "or": [{
                "and": [{
                        __op: "==",
                        "field1": "value1"
                    },
                    {
                        __op: "!=",
                        "field2": "value2"
                    },
                    {
                        __op: "<",
                        "field3": "value3"
                    },
                    {
                        __op: ">",
                        "field4": "value4"
                    }
                ]
            },
            {
                "or": {
                    "and": [{
                            __op: "==",
                            "field5": "value5"
                        },
                        {
                            __op: "!=",
                            "field6": "value6"
                        }
                    ],
                    "<": {
                        "field1": "100"
                    }
                }
            }
        ]
    };


    let query = new Query("users", null, expObj, null);
    console.log(query.toDelete());
    console.log(query);

    let mongoQ = new MongoQuery("users", null, expObj, null);
    console.log(mongoQ.toDelete());
    console.log(mongoQ);
}


testSelectQueryComplex();
testSelectQuerySimple();
testUpdateQueryComplex();
testUpdateQuerySimple();
testInsertQuery();
testDeleteQuery();
testDeleteComplexQuery();