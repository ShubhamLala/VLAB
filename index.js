//===================
//Import dependencies
//===================
var express = require("express");
var sessions = require("express-session");
var bodyParser = require("body-parser");
var sql = require("./models/db");
var nodemailer = require("nodemailer");
//=======================
//Initialize dependencies
//=======================
var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(sessions({
    secret: "ajskld;fadfqrwr",
    resave: false,
    saveUninitialized: false
}));
app.use(express.static(__dirname + "/public"));
app.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next()
})

//================
//Importing routes
//================
var home = require("./routes/home");
var register = require("./routes/register");
var login = require("./routes/login");
var test = require("./routes/test");
var logout = require("./routes/logout");
var leaderboard = require("./routes/leaderboard");
var certificate = require("./routes/certificate");
var qrdetails = require("./routes/scanqrdetails");
var admin_login = require("./routes/admin_login");
var temp = require("./routes/temp");
var user = require("./routes/user");
var report = require("./routes/report");
//============
//Using routes
//============
app.use("/",login);
app.use("/register",register);
app.use("/home",home);
app.use("/test",test);
app.use("/logout",logout);
app.use("/leaderboard",leaderboard);
app.use("/generateCertificate",certificate);
app.use("/qrdetails",qrdetails);
app.use("/admin/login",admin_login);
app.use("/temp",temp);
app.use("/user",user);
app.use("/report",report);

app.listen(4000,function(){
    console.log("listening on port 4000");
})

