const Chat = require("../models/chatModel");
const User = require("../models/User");

const accessChat = async (req, res) =>{
    const { userId } = req.body;

    if(!userId){
        return res.status(400).send("UserId param not sent");
    }

    try{
        let chat = await Chat.find({
            isGroupChat: false,
            $and:[
                { users:{ $elemMatch:{$eq: req.user._id}}},
                { users:{ $elemMatch:{$eq: userId}}}
            ]
        })

        .populate("users", "-password")
        .populate("latestMessage");

        chat = await User.populate(chat,{
            path: "latestMessage.sender",
            select: "name email",
        });

        if(chat.length > 0){
            res.send(chat[0]);
        }else{
            const chatData = {
                chatName: "sender",
                isGroupChat: false,
                users: [req.user._id, userId],
            };

            const createdChat = await Chat.create(chatData);

            const fullChat = await Chat.findOne({_id: createdChat._id})
            .populate("user", "-password");
            
            res.status(200).send(fullChat);
        }

    }catch(error){
        res.status(500).send(error.message);
    }
};

module.exports = {accessChat};