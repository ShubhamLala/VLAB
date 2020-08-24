var express = require("express");
var router = express.Router();
var sql = require("../models/db")
router.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next();
})
router.get("/",function(req,res){
    sql.query("select id, question, option_1,option_2,option_3,option_4,answer from questions",function(err,result){
        if(err){console.log(err)}
        else{
            res.render("temp.ejs",{result:result})
        }
    })
})

router.get("/time",function(req,res){
    sql.query("select time from expire",function(err,result){
        if(err){console.log(err)}
        else{
            var requestTime = new Date();
            res.send("nothing");
            var entryTime = result[0].time
            console.log(requestTime-entryTime)
        }
    })
})
module.exports = router