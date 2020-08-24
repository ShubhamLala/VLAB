var express = require("express");
var router = express.Router();
var sql = require("../models/db")
var crypto = require("crypto-js");
router.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next();
})

var middleware = function(){
    return function(req,res,next){
        var link = req.params.url;
        var regno = req.params.rollno;
        sql.query("select qrlink from users where rollno=?",[regno],function(err,result){
            if(err){res.send("error occured");console.log(err)}
            else if(result.length != 0 && result[0].qrlink === link){next()}
            else{res.redirect("/")}
        })
    }
}
router.get("/:url/:rollno",middleware(), function(req,res){
    if(!req.session.auth){
        res.render("qrdetails.ejs",{link:req.params.url,roll:req.params.rollno,finalresult:"none",show:false});
    }
    else{
        var rollno = req.params.rollno;
        sql.query("select * from marks where rollno=?",[rollno],function(err,result){
        if(err){console.log(err)}
        else{
            var finalresult = []
            for(var i = 0;i<result.length;i++)
            {
                var temp = [];
                temp.push(result[i].rollno);
                temp.push(result[i].cat);
                temp.push(result[i].m_ob);
                temp.push(result[i].d_t);
                finalresult.push(temp);
        }
        req.session.auth = false;
        res.render("qrdetails.ejs",{finalresult:finalresult,show:true})
    }
    })
}
})
router.post("/:url/:rollno",middleware(),function(req,res){
    var rollno = req.params.rollno;
    var link = req.params.url;
    var password = crypto.SHA256(req.body.password).toString();
    sql.query("select password from users where rollno=?",[rollno],function(err,result){
        if(err){console.log(err)}
        else if(result[0].password === password){
            req.session.auth = true;
            res.redirect("/qrdetails/"+link+"/"+rollno);
        }
    })
})

module.exports = router;