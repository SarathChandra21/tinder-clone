const express = require("express");

const connectDB = require("./config/database");
const app = express();
const User = require("./models/user");

app.use(express.json());

app.post("/signup", async (req,res)=>{
    const user = new User(req.body);
    try{
        await user.save();
        res.send("User saved to database successfully");
    }catch(err){
        res.status(400).send("Error in saving data to DB"+err.message);
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

