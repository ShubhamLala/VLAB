var express = require("express");
var router = express.Router();

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
router.use(function(req,res,next){
        res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
        next();
})
router.get("/", middleware(), function(req,res){
    if(req.session.cert != undefined){req.session.cert = undefined}
    var isLoggedIn = true;
    if(req.session.userId === undefined) { isLoggedIn = false; } // checks if the user is logged in, if yes then
    res.render("home.ejs",{isLoggedIn: isLoggedIn});    
          // don't display the login,register routes only logout route
})

module.exports = router;