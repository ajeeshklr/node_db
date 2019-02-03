// node test-sqlcipher-fts.js
'use strict';

var sqlite3 = require('/Projects/SDKs/sqlitecipher/build/node_modules/sqlite3'); // SDK where sqlcipher is installed.
var db = new sqlite3.Database('./test.sqlcipher');

db.serialize(function () {
    var stmt, messages;

    db.run("PRAGMA KEY = 'some_secret'");
    // db.run("PRAGMA key = \"x'2DD29CA851E7B56E4697B0E1F08507293D761A05CE4D1B628663F411A8086D99'\"");
    db.run("PRAGMA CIPHER = 'aes-128-cbc'");

    // db.run("CREATE TABLE messages(id INTEGER, user VARCHAR, msg TEXT)");
    // db.run("CREATE VIRTUAL TABLE messages_fts USING FTS4(user VARCHAR, msg TEXT)");

    stmt = db.prepare("INSERT INTO messages(id, user, msg) VALUES (?, ?, ?)");
    messages = [
        [1, 'Ajeesh B Nair', 'this is test message number one']
    ];
    messages.forEach(function (msg) {
        stmt.run(msg);
    });
    stmt.finalize();

    db.run("INSERT INTO messages_fts SELECT user, msg FROM messages");
    db.get("SELECT * FROM messages INNER JOIN messages_fts ON messages.user = messages_fts.user WHERE messages_fts.msg MATCH 'one'", function (err, data) {
        if (err) {
            console.error(err);
            return;
        }

        console.log(data);
    });
    db.all("SELECT * FROM messages INNER JOIN messages_fts ON messages.user = messages_fts.user WHERE messages_fts.msg MATCH 'two'", function (err, data) {
        if (err) {
            console.error(err);
            return;
        }

        console.log(data);
    });
    db.each("SELECT * FROM messages INNER JOIN messages_fts ON messages.user = messages_fts.user WHERE messages_fts.msg MATCH 'message'", function (err, data) {
        if (err) {
            console.error(err);
            return;
        }

        console.log(data);
    });
});