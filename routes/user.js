var express = require("express");
var sql = require("../models/db");
var router = express.Router();
var crypto = require("crypto-js");
var middleware = function(){
    return function(req,res,next){
        if(req.session.userId != undefined)
        {
            next()
        }
        else if(req.session.test){
            res.redirect("/test/review/"+req.session.subject)
        }
        else
        {
            res.redirect("/")
        }
    }
}


router.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next();
})

router.get("/account",middleware(),function(req,res){
    var regno = req.session.userId;
    if(req.query.view == undefined){res.render("user_account.ejs",{view:"none",details:"none"});}
    else if (req.query.view === "profile"){
        var maxMarks;
        var numOfTestsTaken;
        var averageMarks;
        sql.query("select m_ob from marks where rollno=?",[regno],function(err,result){
            if(err){console.log(err)}
            else{
                var marks = [];
                maxMarks = 0;
                numOfTestsTaken = result.length;
                averageMarks = 0;
                for(var i = 0;i<result.length;i++){
                    averageMarks+=result[i].m_ob;
                    marks.push(result[i].m_ob);
                    if(result[i].m_ob > maxMarks) {maxMarks = result[i].m_ob}
                }
                averageMarks/=result.length;
                sql.query("select firstname,lastname from users where rollno=?",[regno],function(error,resu){
                    if(error){console.log(error)}
                    else{
                        var firstname = resu[0].firstname;
                        var lastname = resu[0].lastname;
                        var userDetails = {
                            username: regno,
                            maxMarks:maxMarks,
                            numOfTestsTaken:numOfTestsTaken,
                            averageMarks:averageMarks,
                            firstname: firstname,
                            lastname: lastname
                        };
                        res.render("user_account.ejs",{view:"profile",details:userDetails})
                    }
                })
            }
        })
    }
    else if(req.query.view === "marks"){
        sql.query("select cat, m_ob,d_t from marks where rollno=?",[regno],function(err,result){
            if(err){console.log(err)}
            else{res.render("user_account.ejs",{view:"marks",details:result})}
        })
    }
    else if(req.query.view === "security"){
        sql.query("select status from email_subscription where rollno=?",[regno],function(err,result){
            if(err){console.log(err)}
            else{
                var status = parseInt(result[0].status,10);
                var message = {};
                if(status === 0) {message = {subscription: "not subscribed"}}
                else if(status === 1){message = {subscription:"subscribed"}}
                res.render("user_account.ejs",{view:"security",details:message})
            }
        })
    }
})
router.post("/account/resetpassword",function(req,res){
    var rollno = req.session.userId;
    var current = crypto.SHA256(req.body.current).toString();
    sql.query("select password from users where rollno=?",[rollno],function(err,result){
        if(err){console.log(err)}
        else if(result[0].password === current){
            var newPass = req.body.new;
            var confirm = req.body.confirm;
            if(newPass === confirm){
                newPass = crypto.SHA256(newPass).toString();
                sql.query("update users set password=? where rollno=?",[newPass,rollno],function(error,resu){
                    if(error){console.log(error)}
                    else{res.redirect("/user/account?view=security")}
                })
            }
        }
    })
})
router.post("/account/emailsubscription",function(req,res){
    var rollno = req.session.userId;
    var status;
    if(req.body.email === "disable"){status = 0}
    else if(req.body.email === "enable"){status = 1}
    sql.query("update email_subscription set status=? where rollno=?",[status,rollno],function(err,result){
        if(err){console.log(err)}
        else{
            res.redirect("/user/account?view=security")
        }
    })
})
router.post("/account/getcertificate",function(req,res){
    var index = req.body.index;
    var regno = req.session.userId;
    sql.query("select m_ob from marks where rollno=?",[regno],function(err,result){
        if(err){console.log(err)}
        else{
            var marks = result[index].m_ob;
            if(marks >= 0.9*50*4){req.session.cert = "CertificateofMerit.jpg"}
            else {req.session.cert = "CertificateofParticipation.jpg"}
            res.redirect("/generateCertificate");
        }
    })
})

router.post("/account/changeFname",function(req,res){
    var fname = req.body.fname;
    var rollno = req.session.userId;
    sql.query("update users set firstname=? where rollno=?",[fname,rollno],function(err,result){
        if(err){console.log(err)}
        else{
            res.redirect("/user/account?view=profile")
        }
    })
})

router.post("/account/changeLname",function(req,res){
    var lname = req.body.lname;
    var rollno = req.session.userId;
    sql.query("update users set lastname=? where rollno=?",[lname,rollno],function(err,result){
        if(err){console.log(err)}
        else{
            res.redirect("/user/account?view=profile")
        }
    })
})
router.get("/account/report",function(req,res){
    res.render("report.ejs")
})
module.exports = router;