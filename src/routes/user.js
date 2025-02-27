const express = require("express");
const userRouter = express.Router();
const {userAuth} = require("../middlewares/auth");

const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";

userRouter.get("/user/requests/received", userAuth, async(req, res)=>{
    try{
        const loggedInUser = req.user;

        const connectionRequests = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status: "interested"
        }).populate("fromUserId", USER_SAFE_DATA);

        res.json({message: "Connection requests fetched successfully", data: connectionRequests});

    }catch (err) {
        res.status(400).send("ERROR: " + err.message);
    }
});

userRouter.get("/user/connections", userAuth, async(req,res)=>{
    try{
        const loggedInUser = req.user;
        const connections = await ConnectionRequest.find({
            $or: [
                {fromUserId: loggedInUser._id, status: "accepted"},
                {toUserId: loggedInUser._id, status: "accepted"},
            ]
        }).populate("toUserId", USER_SAFE_DATA).populate("fromUserId", USER_SAFE_DATA);

        const data = connections.map((row)=>{
            if(row.fromUserId._id.toString()===loggedInUser._id.toString()) return row.toUserId;
            return row.fromUserId;
        });

        res.send({message: "Connections fetched successfully", data});
    }catch (err) {
        res.status(400).send("ERROR: " + err.message);
    }
});

userRouter.get("/feed", userAuth, async(req,res)=>{
    try{
        const loggedInUser = req.user;

        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 50 ? 50 : limit;
        const skip = (page-1)*limit;

        const connections = await ConnectionRequest.find({
            $or: [
                {fromUserId: loggedInUser._id},
                {toUserId: loggedInUser._id}
            ]
        }).select("fromUserId toUserId");

        const hideUsersFromFeed = new Set();

        connections.forEach((req)=>{
            hideUsersFromFeed.add(req.fromUserId.toString());
            hideUsersFromFeed.add(req.toUserId.toString());
        });

        const users = await User.find({
            $and: [
                {_id: {$nin : Array.from(hideUsersFromFeed)}},
                {_id: {$ne : loggedInUser._id}}
            ],
        }).select(USER_SAFE_DATA).skip(skip).limit(limit);

        res.json( {data: users});
    }catch (err) {
        res.status(400).send("ERROR: " + err.message);
    }
})

module.exports = userRouter;