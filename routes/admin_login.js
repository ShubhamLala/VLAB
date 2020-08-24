var express = require("express");
var router = express.Router();
var sql = require("../models/db")
router.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next();
})
router.get("/",function(req,res){
    res.render("admin_login.ejs");
})

router.post("/",function(req,res){
    var email = req.body.email;
    var password = req.body.password;
    db.query("select * from admin where uname = ? and pwd = ?",[email,password],function(err,result){
        if(err){console.log(err)}
        else if(result.length == 0){console.log("Invalid credentials")}
        else{
            req.session.userId="admin"
            res.render("admin.ejs")
        }
    })
})

router.get("/getallreg",function(req,res){
    db.query("select rollno, email, status from email_subscription",function(err,result){
        if(err){console.log(err)}
        else if(result.length == 0){console.log("no data")}
        else{
            res.render("getallreg.ejs",{result: result,string:"Disable",test:""})
        }
    })
})
router.get("/leaderboard",function(req,res){
    res.render("adminleaderboard.ejs",{shouldDisplay:false,results: "none",catDisplay:"none"})
})
router.post("/getallreg/change",function(req,res){
    console.log(req.body)
    var regno = Object.keys(req.body);
    var values = Object.values(req.body);
    for(var i = 0;i<values.length;i++){
        if(values[i] == "Enable"){values[i] = 1}
        else {values[i] = 0}
    }
    updateValues(regno,values,0)
    res.redirect("/admin/login/getallreg")
})

function updateValues(reg,value,index){
    
        if(index == reg.length){return;}
        else{
            db.query("update email_subscription set status=? where rollno=?",[value[index],reg[index]],function(err,result){
                if(err) {console.log(err)}
                else{
                    index++;
                    updateValues(reg,value,index);
                }
            })
        }
}


router.post("/leaderboard",function(req,res){
    var category = req.body.category;
    var department = req.body.Dept;
    var queryString = "";
    var catDisplay = false;
    if(department === "ALL")
    {
        queryString = "select rollno,firstname,cat,m_ob from marks natural join users where marks.rollno = users.rollno and marks.cat='"+category+"'";
        catDisplay = true;
    }
    else
    {
        queryString = "select rollno,firstname,m_ob from marks natural join users where marks.rollno = users.rollno and marks.cat='"+category+"' and users.branch='"+department+"'";
        
    }
    sql.query(queryString,function(error,result){
        if(error) {console.log(error); }
        else
        {
            var finalResult = [];
            for(var i = 0;i<result.length;i++)
            {
                var temp = [];
                temp.push(result[i].rollno);
                temp.push(result[i].firstname);
                temp.push(result[i].cat);
                temp.push(result[i].m_ob);
                finalResult.push(temp);
            }
            var shouldDisplay = true;
            res.render("adminleaderboard.ejs",{shouldDisplay:shouldDisplay, results: finalResult,catDisplay:catDisplay})
        }
    })
})



module.exports = router;