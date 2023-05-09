
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");
const session=require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


const app = express();


app.use(express.static("public"));

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  }))

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect('mongodb://127.0.0.1:27017/userDB',{useNewUrlParser:true});

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId: String,
    think:String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User=mongoose.model("User",userSchema);
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support 
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
//since above serialize and deserialise get failed(as this is from passport-local-mongoose) later so we use passport.js model of serialize and deserialise which are given below

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
  

 passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/jnuu",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));+


app.get("/",function(req,res){
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));


app.get('/auth/google/jnuu', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to AboutJNU.
    res.redirect('/AboutJNU');
  });

app.get("/login",function(req,res){
    res.render('login');
});


app.get("/register", async function(req,res){
    res.render('register');
})

app.get("/AboutJNU", function(req,res){
    if(req.isAuthenticated()){
        res.render("AboutJNU");
    }else{
        res.redirect("/login")
    }
})

app.get("/courses",function(req,res){
    if(req.isAuthenticated()){
        res.render("Courses");
    }else{
        res.redirect("/login")
    }
});


// but in this logout when i run it show logout require callback so go to net and search then below codethis is better
// app.get("/logout", function(req, res){
//     req.logout();
//     res.redirect("/");
//   });

app.get("/logout", function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect("/");
    });
  });
    

 app.post("/register", function(req,res){
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/AboutJNU");
            })
        }
    });
});


app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/AboutJNU');
  });
      


app.listen(3000,function(){
    console.log("server started at 3000")
});