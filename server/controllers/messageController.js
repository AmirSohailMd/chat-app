const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");

const sendMessage = async (req, res) => {
  const { content, chatId, messageId } = req.body;

  if (!content || !chatId) {
    return res.statu(400).json({ message: "Invalid data passed" });
  }

  try {
    let newMessage = {
      sender: req.user._id,
      content,
      chat: chatId,
      messageId,
    };

    let message = await Message.create(newMessage);

    message = await message.populate("sender", "name email");
    message = await message.populate("chat");
    message = await message.populate("chat.users", "name email");

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendMessage };
