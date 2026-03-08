const Chat = require("../models/chatModel");
const User = require("../models/User");

const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send("UserId param not sent");
  }

  try {
    let chat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })

      .populate("users", "-password")
      .populate("latestMessage");

    chat = await User.populate(chat, {
      path: "latestMessage.sender",
      select: "name email",
    });

    if (chat.length > 0) {
      res.send(chat[0]);
    } else {
      const chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);

      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password",
      );

      res.status(200).send(fullChat);
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const populatedChats = await User.populate(chats, {
      path: "latestMessage.sender",
      selet: "name email",
    });

    res.status(200).send(populatedChats);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

module.exports = { accessChat, fetchChats };
