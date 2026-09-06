const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");

const sendMessage = async (req, res) => {
  const { content, chatId, messageId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({ message: "Invalid data passed" });
  }

  try {
    let newMessage = {
      sender: req.user._id,
      content,
      chat: chatId,
      messageId,
    };

    const chat = await Chat.findOne({
      _id: chatId,
      users: req.user._id,
    });

    if (!chat) {
      return res.status(403).json({
        message: "You are not authorized to send messages in this chat",
      });
    }

    let message = await Message.create(newMessage);

    message = await message.populate("sender", "name email");
    message = await message.populate("chat");
    message = await message.populate("chat.users", "name email");

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fetchMessages = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      users: { $elemMatch: { $eq: req.user._id } },
    });

    if (!chat) {
      return res.status(403).json({
        message: "You are not authorized to view messages in this chat",
      });
    }
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email")
      .populate("chat", "_id users")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage, fetchMessages };
