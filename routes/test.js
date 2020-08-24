var router = require("express").Router();
var sql = require("../models/db");
var NUM_OF_QUESTIONS = 50; //sets the number of questions
var TOTAL_MARKS = 50*4;
var users = {}; // container class for all the users currently giving the test

router.use(function(req,res,next){
    res.header('Cache-control','no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,pre-check=0');
    next();
})
//middleware function that protects the route from unauthorized access
var middleware = function(){
    return function(req,res,next){
        if(req.session.userId === undefined)
        {
            res.redirect("/register");
        }
        else 
        {
            next();
        }
    }
}

var secondMiddleWare = function(){
    return function(req,res,next){
        if(req.session.userId === undefined){res.redirect("/register")}
        else if(!req.session.test){res.redirect("/home")}
        else{next()}
    }
}
router.get("/:subject",middleware(),function(req,res){

    // If the user is new, then initialize the user
    req.session.subject = req.params.subject;
    req.session.test = true;
    if(!users.hasOwnProperty(req.session.userId))
    {
        if(req.params.subject == 'cpp')
        {
            var subject = "'c++'";
        }
        else{ var subject = "'"+req.params.subject+"'"; }
        sql.query("select * from questions where cat="+subject,function(error,result){
            if(error) {console.log(error)}
            else{

                var queIDs = []; //questions ids
                var que = []; //questions array
                var optOne = [];
                var optTwo = [];
                var optThree = [];
                var optFour = [];
                var answers = [];
                var titles = [];

                for(var i = 0 ;i < result.length;i++){
                    que.push(result[i].question);
                    queIDs.push(result[i].id);
                    optOne.push(result[i].option_1);
                    optTwo.push(result[i].option_2);
                    optThree.push(result[i].option_3);
                    optFour.push(result[i].option_4);
                    titles.push(result[i].title);
                    answers.push(result[i].answer);

                }
                //-----------------------------------------------------------------------------------------
            
                // Button status of the user
                var visited = [];
                var answered = [];
                var unvisited = [];
                var flagged = [];
            
                // initialize the buttons as -1
                // answeredbutton holds the option number of the users answer also
                for(var j = 0;j<NUM_OF_QUESTIONS;j++){
                    unvisited.push(j);
                    answered.push(-1);
                    visited.push(-1);
                    flagged.push(-1);
                }
                
                // create a class for the buttonStatuses
                var buttonStatuses = {
                    visitedButtons: visited,
                    answeredButtons: answered,
                    unvisitedButtons: unvisited,
                    flaggedButtons: flagged
                }

                var rand = []; // variable that contains the random numbers that give the random question index
                var k = 0;
                //------------- generates random numbers without duplicates which acts as question indices---------
                while(k < NUM_OF_QUESTIONS){
                    var x = Math.floor(Math.random()*que.length)
                    if(!rand.includes(x))
                    {
                        rand.push(x);
                        k++;
                    }
                }
                //---------------------------------------------------------------------------------
                
                // Populating the question ids of the random questions generated
                var queID = [];
                for(var j = 0;j<rand.length;j++){
                    queID.push(queIDs[rand[j]]);
                }
                //-----------------------------------------------------------------
            
                //To form the questions matrix of the form [[question1,option1,option2,option3,option4],[question2,option1.....]]
                var questions = []
                var finalAnswers = []
                for(var i = 0;i<NUM_OF_QUESTIONS;i++){
                        var oneQuestion = [];
                        oneQuestion.push(que[rand[i]]);
                        oneQuestion.push(optOne[rand[i]]);
                        oneQuestion.push(optTwo[rand[i]]);
                        oneQuestion.push(optThree[rand[i]]);
                        oneQuestion.push(optFour[rand[i]]);
                        oneQuestion.push(titles[rand[i]]);
                        finalAnswers.push(answers[rand[i]]); // Array of correct answers not being sent to ejs 
                        //console.log(answers[rand[i]]);
                        questions.push(oneQuestion);
                }
                //--------------------------------------------------------------------------------------
                var questionIndex = 0; // initialize starting question index as 0

                //complete the user model
                var userObject = {
                    userId: req.session.userId,
                    questionMatrix: questions,
                    questionIds: queID,
                    buttonStatus: buttonStatuses,
                    questionIndex: questionIndex,
                    answers: finalAnswers,
                    titles: titles,
                    subject: req.params.subject,
                    time: new Date()
                }

                //create a key value pair of the form {userSessionId: userObject}, this uniquely identifies the user
                //giving the request
                users[userObject.userId] = userObject;
                var currentUser = users[req.session.userId]; // sets the user currently giving the test

                res.render("test.ejs",{subject: currentUser.subject, questionIndex: currentUser.questionIndex,numOfQuestions: NUM_OF_QUESTIONS, question: currentUser.questionMatrix[currentUser.questionIndex], buttonStatus: currentUser.buttonStatus, timeValue: currentUser.time});        
            }
                })
                
    }
else
{


    var currentUser = users[req.session.userId]; // sets the user currently giving the test

    res.render("test.ejs",{subject: currentUser.subject, questionIndex: currentUser.questionIndex,numOfQuestions: NUM_OF_QUESTIONS, question: currentUser.questionMatrix[currentUser.questionIndex], buttonStatus: currentUser.buttonStatus,timeValue: currentUser.time});
    //res.send(req.params.subject + "test");
    // renders the test module with the following parameters
    //a. The questionIndex which is to be displayed
    //b. the total number of questions
    //c. the question array of the form [question,option1,option2,option3,option4]
    //d. Status of the different buttons
}
})

//Route to controll the color changes of the corresponding buttons

router.post("/controller/:subject",middleware(), function(req,res){
    var id = req.session.userId; // the id of requesting user
    //--------------if the user navigates after answering the question-----------------
    if(req.body.hasOwnProperty("OptionNumber"))
    {
        users[id].buttonStatus.answeredButtons[users[id].questionIndex] = parseInt(req.body.OptionNumber); // assigned the option user marked
    }

    users[id].buttonStatus.unvisitedButtons[users[id].questionIndex] = -1; // since user has come to this route it means the user has
                                                                           //visited the current question index, therefore update the arrays
    users[id].buttonStatus.visitedButtons[users[id].questionIndex] = 1;

    if (req.body.hasOwnProperty("finalSubmit")) // if the user clicks on submit render the submit confirm dialogue
    {
        res.redirect("/test/review/"+req.session.subject);
    }
    else
    {
    if(req.body.hasOwnProperty("next") && users[id].questionIndex < NUM_OF_QUESTIONS - 1) // if the user clicks next and the question is not last
                                                                                          //increment the question index
    {
        users[id].questionIndex++;
    }

    else if (req.body.hasOwnProperty("navigator")) // change question index according to the navigation value
    {
        users[id].questionIndex = parseInt(req.body.navigator,10);
    }
    else if (req.body.hasOwnProperty("prev") && users[id].questionIndex > 0) // same as next
    {
        users[id].questionIndex--;
    }
    else if (req.body.hasOwnProperty("clear")) // reset the current question index to -1 in the answeredbuttons
    {
        users[id].buttonStatus.answeredButtons[users[id].questionIndex] = -1;
    }
    else if (req.body.hasOwnProperty("flag")) // change currentquestionindex in flagged array from -1 to 1 
    {
        users[id].buttonStatus.flaggedButtons[users[id].questionIndex] = 1;
    }
    else if (req.body.hasOwnProperty("deflag")) // opposite of flag
    {
        users[id].buttonStatus.flaggedButtons[users[id].questionIndex] = -1;
    }
    res.redirect("/test/"+users[id].subject);

    }
}
)
router.get("/review/:subject",secondMiddleWare(),function(req,res){
    res.render("review.ejs",{subject: req.params.subject});
})
//Route that handles user confirmation and calculates the score
router.post("/review/:subject",secondMiddleWare(), function(req,res){

    if(req.body.hasOwnProperty("no")) // if user doesn't confirm then redirect to the test page 
    {
        res.redirect("/test/"+users[req.session.userId].subject);
    }
    else // if user confirms submit then calculate final score
    {
        id = req.session.userId; // current user id
        var matrix = users[id].questionMatrix;
        var answerSelected = [];
        var titles = [];
        var selectedAnswers = users[id].buttonStatus.answeredButtons; //Answer marked by user
        for(var i = 0;i < NUM_OF_QUESTIONS;i++)
        {
            //console.log(selectedAnswers[i]);
            answerSelected.push(matrix[i][selectedAnswers[i]]);
            // titles.push(users[id].questionMatrix[5]);
            titles.push(matrix[i][5]);
        }
        //var questionId = users[id].questionIds; // question ids generated in the beggining 
        var correctAnswers = users[id].answers; // correct answers which is queried from database
        var totalScore = 0; // container for the score

        // ********************************* Report Part *******************************

        if(req.params.subject === 'c'){
                
            for(var i = 0;i<NUM_OF_QUESTIONS;i++)
            {
                if(selectedAnswers[i] != -1)
                {   
                    if(answerSelected[i] === correctAnswers[i])
                    { 
                        if(matrix[i][5] === 'function'){
                            sql.query("update c_titles set _"+matrix[i][5]+"=_"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                            sql.query("update c_titles set corr__"+matrix[i][5]+"=corr__"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                        }else{
                            sql.query("update c_titles set "+matrix[i][5]+"="+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                            sql.query("update c_titles set corr_"+matrix[i][5]+"=corr_"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                        }
                    }
                    else {
                        if(matrix[i][5] === 'function'){
                            sql.query("update c_titles set _"+matrix[i][5]+"=_"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                            sql.query("update c_titles set corr__"+matrix[i][5]+"=corr__"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                        }else{
                            sql.query("update c_titles set "+matrix[i][5]+"="+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                            sql.query("update c_titles set incorr_"+matrix[i][5]+"=incorr_"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                        }
                    }
                }
            }


        }else if(req.params.subject === 'cpp'){
            for(var i = 0;i<NUM_OF_QUESTIONS;i++)
            {
                if(selectedAnswers[i] != -1)
                {   
                    if(answerSelected[i] === correctAnswers[i])
                    { 
                        if(matrix[i][5] === 'function'){
                            sql.query("update cpp_titles set _"+matrix[i][5]+"=_"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                            sql.query("update cpp_titles set corr__"+matrix[i][5]+"=corr__"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                        }else{
                            sql.query("update cpp_titles set "+matrix[i][5]+"="+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                            sql.query("update cpp_titles set corr_"+matrix[i][5]+"=corr_"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                        }
                    }
                    else {
                        if(matrix[i][5] === 'function'){
                            sql.query("update cpp_titles set _"+matrix[i][5]+"=_"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                            sql.query("update cpp_titles set corr__"+matrix[i][5]+"=corr__"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                        }else{
                            sql.query("update cpp_titles set "+matrix[i][5]+"="+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                            sql.query("update cpp_titles set incorr_"+matrix[i][5]+"=incorr_"+matrix[i][5]+"+ 1 where rollno='"+id+"'",function(error,result){
                                if(error){
                                    console.log(error);
                                }
                            });
                        }
                    }
                }
            }

        }else{

        }


        
        // *****************************************************************************


        // correct answer +4, wrong answer -1, calculate score below
        for(var i = 0;i<NUM_OF_QUESTIONS;i++)
        {
            if(selectedAnswers[i] != -1)
            {
                if(answerSelected[i] === correctAnswers[i]) { totalScore+=4}
                else {totalScore--;}
            }
        }
        sql.query("insert into marks values(?,?,?,now())",[id,req.params.subject,totalScore])
        var percentage = totalScore/TOTAL_MARKS * 100;
        if(percentage >= 90) {req.session.cert = "CertificateofMerit.jpg"}
        else if (percentage < 90) {req.session.cert = "CertificateofParticipation.jpg"}
        //since the user submitted the test, delete it from the currect users class which is giving the test
        delete users[id];
        req.session.test = false;
        // render the results page with the total score as parameter
        res.render("results.ejs",{score: totalScore,rollno: req.session.userId});
    }
    
    //for(var i = 0;i < questionId.length;i++){
        //"select correct_opt from questions where question_id ='"+questionId[i]+"'" 
    //}
})

module.exports = router;

