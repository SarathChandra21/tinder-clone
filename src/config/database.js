const mongoose = require('mongoose');

const connectDB = async ()=>{
    await mongoose.connect("mongodb+srv://dschandra2003:CYJ1oY7qFcLZhBSG@tinder.2xshp.mongodb.net/devTinder?retryWrites=true&w=majority&appName=tinder");
};

module.exports = connectDB;