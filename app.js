if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); 
const expressError = require("./util/expressError.js");
const { error } = require("console");
const session = require("express-session");
const {MongoStore} = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./router/listings.js");
const reviewRouter = require("./router/review.js");
const userRouter = require("./router/user.js");
const user = require("./models/user.js");

// const mongoURL = "mongodb://127.0.0.1:27017/wanderLust";
const dbUrl = process.env.ATLAS_BS_URL;

main().then(()=>{
    console.log("connected to db")
}).catch((err)=>{
    console.log(err);
})

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 3600, 
});

store.on("error",() => {
    console.log("Error in MONGO SESSION STORE",err);
})

const sessionopt = {
    store,
    secret : process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    Cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    } 
};



app.use(session(sessionopt));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.msg = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUsr = req.user;
    next();
})

// app.get("/demouser",async(req,res)=>{
//     let fakeuser = new User({
//         email: "Abc@gmail.com",
//         username: "Student"
//     });
//     let registeruser = await User.register(fakeuser,"helloworld");
//     res.send(registeruser);  
// });

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);


app.all("*splat",(req,res,next)=>{
    next(new expressError(404,"Page not Found"));
});

app.use((err,req,res,next)=>{
    let {status = 500, message = "something went wrong"} = err;
    res.status(status).render("error.ejs",{message});
    // res.status(status=404).send(message);
});

// const PORT = process.env.PORT || 8080;

app.listen(3000,()=>{
    console.log("server is listening");
});