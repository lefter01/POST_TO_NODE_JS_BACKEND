var express = require('express');
app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var config = require('./config/main');
var User = require('./models/user');
var jwt = require('jsonwebtoken');
var port = 2222;



//use body parser to post requests for api use
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//log requests to console
app.use(morgan('dev'));


//Init passport
app.use(passport.initialize());

//connect to mongodb
mongoose.connect(config.database);

//passport strategy
require('./config/passport')(passport);
//create api group routes
var apiRoutes = express.Router();

//register
apiRoutes.post('/register',function(req,res)
{
    console.log(req.body.name);
   var newUser = new User({
       email: req.body.email,
       password: req.body.password,
       name: req.body.name,
       age : req.body.age
   }) ;
   
   //try to save user      
   newUser.save(function(err)
   {
       if(err)
           return res.json({success : false });
       res.json({success: true});
   });
});

//authenticate or log in
apiRoutes.post('/authenticate',function(req,res)
{
    console.log('sto body ths formas   : : : '+req.body.email);
    User.findOne({email: req.body.email},function(err,user)
    {               
        if(err)
        {
            throw err;
        }
        if(!user)
        {
            res.send({success: false,message:'could not authenticate'});
        }
        //compare passwords
        else
        {           
            user.comparePassword(req.body.password,function(err,isMatch)
            {
                if(isMatch && !err)
                {
                    //create the token
                    var token = jwt.sign(user,config.secret,{
                    expiresIn: 10000//in seconds
                    });
                    res.json({
                        success : true,
                        token : 'JWT ' + token,
                        email : user.email,
                        age : user.age,
                        name : user.name
                        
                    });  
                }                
                else
                {
                    res.json({success:false,message:'couldnt not authenticate passwords didnt match'});
                }             
            });
        }
    });
});
apiRoutes.get('/showAllUsers',passport.authenticate('jwt',{session:false}),function(req, res)
{
    User.find({}, function(err, users) {   
    
    res.json({allusers: users});  
  });
    
});
//do this for every activity user is trying to open
apiRoutes.get('/dashboard',passport.authenticate('jwt',{session:false}),function(req, res)
{
    console.log('it worked user mail is : ' + req.user.email);
    res.json({success: true});
    
});
//set url for api group routes

app.use('/api',apiRoutes);

app.get('/',function(req,res){
   res.send("under construction"); 
});


app.listen(port);
console.log('application is now listening to port : '+port+'.');