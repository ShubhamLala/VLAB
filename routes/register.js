var express = require("express");
var nodemailer = require("nodemailer");//dependency for sending mail
var router = express.Router();
var regExp = /[1-9][0-9][A-Za-z]{3}[0-9]{4}/g; //regex for registration number
var sql = require("../models/db");
var crypto = require("crypto-js");

var URL_LENGTH = 64;
router.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next();
})
var users = {}
// the element which sends the mail from test account
var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "testmailmailtest2@gmail.com",
        pass: "!Test123"
    }
})

// middleware that checks if the users is already signed in, if yes then redirect to home page
var checkLoginStatus = function(){
    return function(req,res,next){
        if(req.session.userId != undefined){
            res.redirect("/home");
        }
        else if(req.session.test){
            res.redirect("/test/review/"+req.session.subject)
        }
        else
        {
            next();
        }
    }
}

//home route
router.get("/",checkLoginStatus(), function(req,res){
    if(req.query.error != undefined){res.render("register.ejs",{error:true})}
    else{res.render("register.ejs",{error:false})};
})


router.post("/",function(req,res){
    req.body.regno = req.body.regno.toUpperCase();
    sql.query("select rollno from users where rollno=?",[req.body.regno],function(err,result){
        if(err){console.log(err)}
        else if(result.length != 0){res.redirect("/register?error=registered")}
        else{
            req.body.password = crypto.SHA256(req.body.password).toString();
            req.body.confirm = crypto.SHA256(req.body.confirm).toString();
            if(req.body.password === req.body.confirm && regExp.test(req.body.regno) && !Object.keys(users).includes(req.body.regno)){
                if(req.body.status != undefined){req.body.status = 1}
                else{req.body.status = 0}
                users[req.body.regno] = {
                    email: req.body.email,
                    password: req.body.password,
                    confirm: req.body.confirm,
                    rollno: req.body.regno,
                    dept: req.body.branch,
                    fname: req.body.fname,
                    lname: req.body.lname,
                    status: req.body.status
                }
                req.session.temp = req.body.regno;
                     //assign the user id to the user
                    var otp  = 0; // container of otp
            
                    //generate random 6 digit otp
                    for(var i = 0;i<6;i++)
                    {
                        otp *= 10;
                        otp += Math.floor(Math.random()*10);
                    }
                    
                    users[req.body.regno].otp = otp; // set the otp for current session
            
                    //container variable for the outgoing mail
                    var mail = {
                        from: "testmailmailtest2@gmail.com",
                        to: req.body.email,
                        subject: "OTP Confirmation VLAB",
                        text: "Copy the OTP given and paste it into the input box " + otp
                    }
            
                    //send the mail, if the mail sent is successful load the confirmation of otp page
                    //else log the error message
                    console.log("reached")
                    transporter.sendMail(mail,function(err,info){
                        if(err) 
                        { 
                            console.log(err)
                            res.send("mail not sent");
                        }
                        else 
                        {
                            users[req.body.regno].time = new Date();
                            res.redirect("/register/otpcheck")
                        }
                    })
                } else {
                    console.log("error")
                }
        }
    })
})

router.get("/otpcheck",function(req,res){
    res.render("OtpConfirm.ejs")
})
//Route that checks for the otp verification
router.post("/otpcheck",function(req,res){
    var regno = req.session.temp;
    var time = new Date();
    if(time - users[regno].time < 300000){
        //req.session.temp = undefined;
        if(req.body.otpfield == users[regno].otp) // if otp matches redirect to home route
        {
            var email = users[regno].email;
            var password = users[regno].password;
            var dept = users[regno].dept;
            var firstname = users[regno].fname;
            var lastname = users[regno].lname;
            var status = users[regno].status;
            var qrlink = generateString(URL_LENGTH);
            sql.query("insert into users values(?,?,?,?,?,?,?)",[regno,email,password,dept,firstname,lastname,qrlink],function(err,finalResult){
                if (err) {console.log(err)}
                else{
                    sql.query("insert into email_subscription values(?,?,?)",[regno,status,email],function(error,done){
                        if(error){console.log(error)}
                        else{
                            req.session.userId = regno;
                            delete users[regno];
                            res.redirect("/home");
                            sql.query("insert into c_titles values('"+regno+"',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                            sql.query("insert into cpp_titles values('"+regno+"',0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                        }
                    })
                }
            })
        }
        else{
            res.render("OtpConfirm.ejs")
        }
    }
    else
    {
        delete users[req.session.temp];
        req.session.temp = undefined;
        res.redirect("/register");
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
module.exports = router;