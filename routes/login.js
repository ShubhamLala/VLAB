var express = require("express");
var sql = require("../models/db");
var router = express.Router();
var crypto = require("crypto-js");
var URL_LENGTH = 100;
var nodemailer = require("nodemailer");

var middleware = function(){
    return function(req,res,next){
        if(req.session.userId === undefined)
        {
            next()
        }
        else if(req.session.test){
            res.redirect("/test/review/"+req.session.subject)
        }
        else
        {
            res.redirect("/home")
        }
    }
}

var check = function(){
    return function(req,res,next){
        sql.query("select * from expire where link=?",[req.params.link],function(err,result){
            if(err){console.log(err)}
            else if(result.length == 0){res.redirect("/")}
            else {
                var newTime = new Date();
                if (newTime - result[0].time > 600000){res.redirect("/")}
                else{next();}
            }
        })
    }
}
router.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next();
})
router.get("/",middleware(),function(req,res){
    if(req.query.credential != undefined){res.render("login.ejs",{error:true})}
    else{res.render("login.ejs",{error:false});}
})

router.post("/",function(req,res){
    var rollno = req.body.regno.toUpperCase();
    var password = req.body.password;
    var x = crypto.SHA256(password).toString();
    sql.query("select * from users where rollno=?",[rollno],function(err,result){
        if(err) { console.log(err); }
        else { 
            if(result.length != 0)
            {
                if(x == result[0].password)
                {
                    req.session.userId = rollno;
                    res.redirect("/home");
                }
                else
                {
                    res.redirect("/?credential=false")
                }
            }
            else
            {
            res.redirect("/register");
            } 
        }
    });
})

router.get("/forgotpassword",function(req,res){
    res.render("forgot_password.ejs")
})

router.post("/forgotpassword",function(req,res){
    var regno = req.body.username.toUpperCase();
    var url = generateString(URL_LENGTH);
    sql.query("select email from expire natural join users where expire.rollno = users.rollno and expire.rollno=?",[regno],function(err,result){
        if(err){console.log(err)}
        else if(result.length != 0){
            sql.query("update expire set link=? , time=now() where rollno=?",[url,regno],async function(error,resu){
                if(error){console.log(error)}
                else{
                    try{
                        url = "http://localhost:4000/"+url+"/resetpassword"
                        var x = await sendForgotMail(url,result[0].email)
                        res.send("A mail has been sent to your registered email")
                    }
                    catch(errorr){
                        console.log(errorr)
                    }
                }
            })
        }
        else{
            sql.query("insert into expire values(?,?,now())",[regno,url], async function(error,resu){
                if(error){console.log(error)}
                else{
                    try{
                        url = "http://localhost:4000/"+url+"/resetpassword"
                        var x = await sendForgotMail(url,result[0].email)
                        res.send("A mail has been sent to your registered email")
                    }
                    catch(errorr){
                        console.log(errorr)
                    }
                }
            })
        }
    })
})

router.get("/:link/resetpassword",check(),function(req,res){
    res.render("changef_password.ejs",{link: req.params.link});
})

router.post("/:link/resetpassword",check(),function(req,res){
    var password = req.body.password;
    var confirm = req.body.confirm;
    if(password === confirm){
        password = crypto.SHA256(password).toString();
        sql.query("select rollno from expire where link=?",[req.params.link],function(err,result){
            if(err){console.log(err)}
            else{
                var regno = result[0].rollno;
                sql.query("update users set password=? where rollno=?",[password,regno],function(error,resu){
                    if(error){console.log(error)}
                    else{
                        res.redirect("/");
                    }
                })
            }
        })
    }
})
function generateString(length) {
    var result= '';
    var characters= 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
 
 function sendForgotMail(url,email){
    var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "testmailmailtest2@gmail.com",
            pass: "!Test123"
        }
    })
    var mail = {
        from: "testmailmailtest2@gmail.com",
        to: email,
        subject: "Vlab password reset",
        text: "Click on the link to change the password\n" + url
    }
    transporter.sendMail(mail,function(err,info){
        return new Promise(function(resolve,reject){
            if(err) 
            { 
                reject(err)
            }
            else 
            {
                resolve("success");
            }
        })
        })
 }
module.exports = router;