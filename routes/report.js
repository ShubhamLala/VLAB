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

router.get("/",middleware(),function(req,result){

    const data = {};
    var rollno = req.session.userId;


    sql.query("select count(*) as total from marks where cat = 'c' and rollno ='"+rollno+"'",function(e,r){
        if(e){
            console.log(e);
        }else{
            data.total_c = r[0].total;
            sql.query("select count(*) as total from marks where cat = 'cpp' and rollno ='"+rollno+"'",function(er,re){
                if(er){
                    console.log(er);
                }else{
                    data.total_cpp = re[0].total;
                    sql.query("select * from c_titles where rollno='"+rollno+"'",function(err,res){
                        if(err){
                            console.log(err);
                        }else{
                            data.c_titles = res;
                            sql.query("select * from cpp_titles where rollno='"+rollno+"'",function(erro,resu){
                                if(erro){
                                    console.log(erro);
                                }else{
                                    data.cpp_titles = resu;
                                    sql.query("select min(m_ob) as min, max(m_ob) as max, avg(m_ob) as avg from marks where rollno ='"+rollno+"' and cat = 'c';",function(error,result1){
                                        if(error){
                                            console.log(error);
                                        }else{
                                            data.c_max = result1[0].max;
                                            data.c_min = result1[0].min;
                                            data.c_avg = result1[0].avg;
                                            sql.query("select min(m_ob) as min, max(m_ob) as max, avg(m_ob) as avg from marks where rollno ='"+rollno+"' and cat = 'cpp';",function(error1,result2){
                                                if(error1){
                                                    console.log(error1)
                                                }else{
                                                    data.cpp_max = result2[0].max;
                                                    data.cpp_min = result2[0].min;
                                                    data.cpp_avg = result2[0].avg;
                                                    result.render("report.ejs",{shouldDisplay: false, result: data});
                                                }
                                            });
                                        }
                                    })
                                }
                            })
                        }
                        
                    })

                }
            });
        }
    });

    
})

module.exports = router;