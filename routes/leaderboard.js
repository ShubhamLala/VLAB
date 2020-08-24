var express = require("express");
var router = express.Router();
var sql = require("../models/db");
router.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next();
})
var middleware = function(){
    return function(req,res,next){
        if(req.session.userId === undefined)
        {
            res.redirect("/register");
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

router.get("/",middleware(),function(req,res){
    res.render("leaderboard.ejs",{shouldDisplay: false, results:[]});
})
router.post("/",middleware(),function(req,res){
    var category = req.body.category;
    var department = req.body.Dept;
    var year = req.body.year;
    var queryString = "";
    var catDisplay = false;
    if(year === "ALL"){

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
                res.render("leaderboard.ejs",{shouldDisplay:shouldDisplay, results: finalResult,catDisplay:catDisplay})
            }
        })
    }
    else{
        var currentDate = new Date();
        var checkDate = new Date();
        checkDate.setFullYear(currentDate.getFullYear());
        checkDate.setMonth(6);
        var finalYear;
        year = parseInt(year,10);
        if(currentDate < checkDate){
            finalYear = (currentDate.getFullYear()-year).toString()[2]+(currentDate.getFullYear()-year).toString()[3];
        }
        else{
            year--;
            finalYear = (currentDate.getFullYear()-year).toString()[2]+(currentDate.getFullYear()-year).toString()[3];
        }
        if(department === "ALL")
        {
            queryString = "select rollno,firstname,cat,m_ob from marks natural join users where marks.rollno = users.rollno and marks.cat='"+category+"' and users.rollno like'"+finalYear+"%'";
            catDisplay = true;
        }
        else
        {
            queryString = "select rollno,firstname,m_ob from marks natural join users where marks.rollno = users.rollno and marks.cat='"+category+"' and users.branch='"+department+"' and users.rollno like'"+finalYear+"%'";
            
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
                res.render("leaderboard.ejs",{shouldDisplay:shouldDisplay, results: finalResult,catDisplay:catDisplay})
            }
        })

    }
})



module.exports = router;