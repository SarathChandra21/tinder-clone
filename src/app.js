const express = require("express");

const connectDB = require("./config/database");
const app = express();
const User = require("./models/user");
const {validateSignUpData} = require("./utils/validation");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const {userAuth} = require("./middlewares/auth");

app.use(express.json());
app.use(cookieParser());

app.post("/signup", async (req,res)=>{
    
    try{
        validateSignUpData(req);

        const {firstName, lastName, emailId, password} = req.body;

        const passwordHash = await bcrypt.hash(password, 10);

        const user = new User({
            firstName,
            lastName,
            emailId,
            password: passwordHash,
        });
        await user.save();
        res.send("User saved to database successfully");
    }catch(err){
        res.status(400).send("Error : "+err.message);
    }
});

app.post("/login",async (req,res)=>{
    try{
        const {emailId, password} = req.body;
        const user = await User.findOne({emailId: emailId});
        if(!user){
            throw new Error("Invalid credentials");
        }

        const isPasswordValid = await user.validatePassword(password);
        if(isPasswordValid){
            const token = await user.getJWT();

            res.cookie("token", token, {
                expires: new Date(Date.now() + 8 * 3600000),
            });

            res.send("Login successfully!!!");
        }else{
            throw new Error("Invalid credentials");
        }
       

    }catch(err){
        res.status(400).send("Error : "+err.message);
    }

});

app.post("/sendConnectionRequest", userAuth, async(req,res)=>{
    const user = req.user;
    res.send(user.firstName + " sent connection request.");
})

app.get("/profile", userAuth, async (req,res)=>{
    try{
        const user = req.user;
        res.send(user);
    }catch(err){
        res.status(400).send("Error : "+err.message);
    }
});

app.get("/feed", async (req,res)=>{
    try{
        const users = await User.find({});
        res.send(users);
    }catch(err){
        res.status(400).send("Something went wrong");
    }
});

app.get("/user", async (req,res)=>{
    try{
        const users = await User.find({emailID: req.body.emailID});
        if(users.length===0){
            res.status(404).send("No users found");
        }else{
            res.send(users);
        }
    }catch(err){
        res.status(400).send("Something went wrong");
    }
});

app.patch("/user/:userID",  async (req,res)=>{
    const id = req.parmas?.userID;
    const data = req.body;

    try{
        const ALLOWED_UPDATES = ["photoUrl", "about", "gender", "age", "skills"];
        const isUpdateAllowed = Object.keys(data).every((k)=>{
            ALLOWED_UPDATES.includes(k)
        });
        if(!isUpdateAllowed){
            throw new Error("Update not allowed");
        }
        if(data?.skills.length>10){
            throw new Error("Skills can't be more than 10");
        }
        const user = await User.findByIdAndUpdate(id, data,{
            runValidators: true,
        });
        res.send("User updated successfully");
    }catch(err){
        res.status(400).send("UPDATE FAILED:" + err.message);
    }
});

app.delete("/user", async (req,res)=>{
    const id = req.body.userID;
    try{
        const user = await User.findByIdAndDelete(id);
        res.send("User deleted successfully");
    }catch(err){
        res.status(400).send("Something went wrong");
    }
});



connectDB()
    .then(()=>{
        console.log("Database connection successfully established.");
        app.listen(7777, ()=>{
            console.log("Server listening on Port 7777");
        });
    })
    .catch((err)=>{
        console.error("Database not connected successfully...");
    })

