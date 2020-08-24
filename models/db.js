var mysql = require("mysql");

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "lala",
    database: "vlab_check",
    multipleStatements: false
});

module.exports = connection;