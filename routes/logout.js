var express = require("express");

var router = express.Router();
router.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next();
})
router.get("/",function(req,res){   //destroy the session when the user logs out
    req.session.destroy(function(){
        res.redirect("/");
    })
})

module.exports = router;