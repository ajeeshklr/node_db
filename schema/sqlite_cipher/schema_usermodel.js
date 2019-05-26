let schema = {};

schema.jsonSchema = {
    'fields': ['name', 'age', 'place', 'content'],
    'model': 'user'
};

// SQL schema is for create table, we don't really use that otherwise.
// _id is generally used for id field in the framework.
schema.sqlSchema = "CREATE TABLE user(_id INTEGER PRIMARY KEY AUTOINCREMENT,name VARCHAR,age INTEGER, place TEXT, content TEXT )";

module.exports = schema;