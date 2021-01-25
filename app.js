require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session =require("express-session");
const passport =require("passport");
const passportLocalMongoose =require("passport-local-mongoose");

const app = express();

app.set("view engine","ejs");

app.use(
  bodyParser.urlencoded({
  extended: false,
})
);

app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/birthdaysDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(()=>console.log("MongoDB Connected..."))
.catch(err=>console.log(err));

mongoose.set("useCreateIndex",true);

const birthdaySchema = new mongoose.Schema({
  name: {
  type: String,
  required: true,
  },
  date: {
    type: Date,
    required: true,
},

});

const Birthday = mongoose.model("Birthday", birthdaySchema);

const userSchema = new mongoose.Schema({
  username:{
    type: String,
    required: true,
    path: 'password',
  },

  password:{
    type: String,
    required: true,
  },
  email:{
    type: String,
    required: true,
  },
  birthdays: [birthdaySchema]
})


userSchema.plugin(passportLocalMongoose);


const Userinfo = mongoose.model("Userinfo",userSchema);


passport.use(Userinfo.createStrategy());




passport.serializeUser(Userinfo.serializeUser());
passport.deserializeUser(Userinfo.deserializeUser());

app.get("/nobirthdays", function (req, res) {
  res.render("nobirthdays");
});

app.get("/newbirthday", function (req, res) {
  if(req.isAuthenticated()){
  res.render("newbirthday");
}else{
  res.redirect("/login");
}
});

app.get("/register",function (req,res){
  res.render("register");
});

app.post("/register",function(req,res){
Userinfo.register(new Userinfo({username:req.body.uname,email:req.body.eml,password:req.body.password}),req.body.password, function(err){
  if(err){
    console.log(err);
    res.redirect("/register");
  }else{
    passport.authenticate("local")(req,res,function(){
      console.log("Authenticated");
      res.redirect("/newbirthday");
    })
  }
})

//  const newUser = new Userinfo({
//    name: req.body.uname,
//    email:req.body.eml,
//    password:req.body.psw,
//  });
// newUser.save(function(err){
//   if(!err){
//     console.log("Registered");
//     res.render("newbirthday");
//   }
//   else{
//     console.log(err);
//   }
// });
 });

app.get("/", function (req, res) {
  const today = new Date();

if(req.isAuthenticated()){

  Birthday.find({},
     function(err, data) {

       const todayBday = data.filter((bday) =>{
         if (
           bday.date.getDate() === today.getDate() &&
           bday.date.getMonth() === today.getMonth()
       ) {
         return true;
       }
       return false;
       });
if(todayBday.length > 0) {
  console.log("Hi");
  res.render("home", {
    birthday: todayBday,
  });
}
else{
  res.redirect("/nobirthdays");
}
    }
  );

}
else{
  res.redirect("/register");
}


});


app.get("/login",function (req,res){
  res.render("login");

});

app.post("/newbirthday", function (req, res) {

  const birthday = new Birthday({
    name: req.body.BirthdayName,
    date: req.body.Date
  });
  birthday.save(function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(data);

      Userinfo.update({},
        { $push: { birthdays: data } },
      // function(err,birthday){
      //   if(!err){
      //     if(birthday.birthdays.length > -1)
      //     birthday.birthdays.push(data);
      //     console.log("Added in user");
      //   }else{
      //     console.log(err);
      //   }
      );

      res.redirect("/");
    }
  });
});

app.post("/login",function(req,res){
  const user = new Userinfo({
    uname: req.body.uname,
    psw: req.body.password
  });
  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/");
      });
    }
  })

 // Userinfo.findOne({name: uname},function(err,foundUser){
 //   if(err){
 //     res.redirect("/register");
 //     console.log(err);
 //   }else{
 //     if(foundUser.password === psw){
 //       res.redirect("/");
 //     }else{
 //       res.send("Incorrect password");
 //     }
 //   }
 // })
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("login");
})

app.listen(3000, function() {
  console.log("Server started at port 3000");
});
