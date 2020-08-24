var express = require("express");
var router = express.Router();
var qrCode = require("qrcode")
var sql = require("../models/db")

var middleware = function(){
    return function(req,res,next){
        if(req.session.userId === undefined)
        {
            res.redirect("/register");
        }
        else if(req.session.test){
            res.redirect("/test/review/"+req.session.subject)
        }
        else if(req.session.cert === undefined){res.redirect("/home")}
        else
        {
            next();
        }
    }
}
router.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next();
})
router.get("/", middleware(), function(req,res){
    var rollno = req.session.userId;
    var firstname = "";
    var lastname = "";
    var qrlink = "";
    sql.query("select firstname,lastname,qrlink from users where rollno=?",[rollno],function(error,result){
        if(error) {console.log(error)}
        else{
            firstname = result[0].firstname;
            lastname = result[0].lastname;
            qrlink = result[0].qrlink;
            var type = req.session.cert;
            req.session.cert = undefined;
            qrCode.toDataURL("http://localhost:4000/qrdetails/"+qrlink+"/"+rollno,function(err,url){

                res.render("certificate.ejs",{url:url,firstname: firstname, lastname:lastname,rollno:rollno,type:type})
            })
        }
    })
    
})

module.exports = router;