var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    multer          = require('multer'),
    path            = require('path'),
    localStrategy   = require("passport-local"),
    methodeOverride = require("method-override"),
    User            = require("./models/user"),
    Details         = require("./models/details"),
    Posts           = require("./models/post"),
    moment          = require("moment");
//SETUPs
mongoose.connect("mongodb://localhost/BB2",{useUnifiedTopology:true, useNewUrlParser: true});
app.use(express.static(__dirname + "/public/"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodeOverride("_method"));
app.set("view engine","ejs");
//PASSPORT CONFIGURATIONs
app.use(require("express-session")({
    secret : "we can write any things",
    resave: false,
    saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//CURRENT USER MIDDLEWARE
app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    next();
});
//fILE UPLOAD
var Storage = multer.diskStorage({
    destination:"./public/uploads/",
    filename:(req,file,cb)=>{
        cb(null,file.filename+"_"+Date.now()+path.extname(file.originalname));
    }
});
var upload = multer({
    storage:Storage
}).single('file');
//landing
app.get("/",function(req,res){
    res.render("landing");
});
//INDEX-SHOW ALL MEMBERS 
app.get("/allmembers",function(req,res){
    //get all members form DB
    Details.find({},function(err, allmembers){
        if(err){
            console.log(err);
        }else{
            res.render("home",{members: allmembers,moment:moment});
        }
    });
});
//CREATE - add new member to DB
app.post("/allmembers",isLoggedIn,function(req,res){
    //get data from form and add to compounds array
    var newMember = {
            nickname: req.body.nickname,dob: req.body.dob,kiitmail: req.body.kiitmail,
            address: req.body.address,roomno: req.body.roomno,section: req.body.section,
            phoneno: req.body.phoneno,whatsapp: req.body.whatsapp,facebook: req.body.facebook,
            snapchat: req.body.snapchat,instagram: req.body.instagram,twitter: req.body.twitter,
            linkedin: req.body.linkedin,github: req.body.github,
            author : {
                id: req.user._id,
                username: req.user.username,
                email : req.user.email,
                image : req.user.image,
            }
        }
    //create a new member and save to data base
    Details.create(newMember ,function(err ,newlycreated){
        if(err){
            console.log(err);
        }
        else{
            //redirect back to home page
            res.redirect("/allmembers");
        }
    });
});
//NEW - this for further details of member
app.get("/allmembers/new",isLoggedIn,function(req,res){
    res.render("details");
});
//SHOW ROUTE
app.get("/allmembers/:id",function(req,res){
    //find the member with provided ID
    Details.findById(req.params.id).populate("posts").exec(function(err, foundmember){
        if(err){
            console.log(err);
        }else{
            //render show template with that member
            res.render("profile",{member:foundmember,moment:moment});
        }
    });
});
app.post("/allmembers/:id",upload,function(req,res){
    Details.findById(req.params.id, function(err, member){
        if(err){
            console.log(err);
            res.redirect("/allmembers/"+ req.params.id);
        }
        else{
            var posts = {
                text: req.body.text,
                postimage: req.file.filename,
            }
            //create new comment
            Posts.create(posts, function(err, posts){
                if(err){
                    console.log(err);
                }
                else{
                    posts.save();
                    //connect new comment to campground
                    member.posts.push(posts);
                    //save comment to campground
                    member.save();
                    //redirect campground show page
                    res.redirect('/allmembers/' + req.params.id);
                }
            });
        }
    });
});
//Edit
app.get("/allmembers/:id/edit", function(req,res){
    Details.findById(req.params.id, function(err, foundmember){
        if(err){
            console.log(err);
        }else{
            res.render("edit",{member:foundmember});
        }
    });
});
//UPDATE
app.put("/allmembers/:id", function(req, res){
    //find and update the correct campground
    Details.findByIdAndUpdate(req.params.id ,req.body.member,function(err, updatemembers){
        if(err){
            res.redirect("/allmembers");
        }
        else{
            res.redirect("/allmembers/" + req.params.id);
        }
    });
});
//Server
app.get("/home/server/allmembers",function(req,res){
    Details.find({},function(err, allmembers){
        if(err){
            console.log(err);
        }else{
            res.render("show",{members: allmembers,moment:moment});
        }
    });
});
//Delete
app.delete("/delete/:id",function(req,res){
    Details.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
        }
        res.redirect("/home/server/allmembers");
    });
});
app.delete("/posts/:id",function(req,res){
    Posts.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
        }
        res.redirect("/allmembers");
    });
});
//KIIT SAP LINK
app.get("/sap",function(req,res){
    res.render("kiitlogin");
});
app.get("/about",function(req,res){
    res.render("about");
});
app.get("/bakchodi",function(req,res){
    res.render("bakchodi");
});
//===========
//Auth ROUTES
//===========
//show sign up form
app.get("/register",function(req,res){
    res.render("register");
});
//Register
app.post("/register",upload,function(req,res){
    User.register(new User({username:req.body.username,email:req.body.email,image:req.file.filename,}),req.body.password,function(err,user){
        if(err){
            console.log(err);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req,res,function(){
            res.redirect("/allmembers/new");
        });
    });
});
//SHOW LOGIN FORM
app.get("/login", function(req, res){
    res.render("login");
});
//handling login logic
app.post("/login", passport.authenticate("local",{
    successRedirect: "/allmembers",
    failureRedirect: "/login"
    }), function(req, res){
});
//LOGOUT ROUTE
app.get("/logout",function(req, res){
    req.logout();
    res.redirect("/allmembers");
});
//Define Middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}
app.listen(3000,()=>{
    console.log("BB server has started! by port 3000");
});