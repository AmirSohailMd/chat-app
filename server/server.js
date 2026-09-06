require("dotenv").config();
const PORT = process.env.PORT || 8000;

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
const server = http.createServer(app);

const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Chat = require("./models/chatModel");
const Message = require("./models/messageModel");

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

const corsOptions = {
  origin: clientUrl,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const cors = require("cors");

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

const onLineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = user._id.toString();
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  // console.log("User connected: ", socket.id);

  // socket.on("setup", (userData) => {
  //   if (!userData?._id) return;

  //   socket.join(userData._id);
  //   socket.userId = userData._id;
  //   onLineUsers.set(userData._id, socket.id);

  //   socket.emit("connected");

  //   io.emit("online users updated", Array.from(onLineUsers.keys()));
  //   console.log("User joined room & is ONLINE: ", userData._id);
  // });

  const userId = socket.userId;

  socket.join(userId);
  onLineUsers.set(userId, socket.id);

  socket.emit("connected");
  io.emit("online users updated", Array.from(onLineUsers.keys()));

  console.log("Authenticated socket connected:", userId);

  socket.on("join chat", async (chatId) => {
    try {
      const chat = await Chat.exists({
        _id: chatId,
        users: socket.userId,
      });

      if (!chat) return;

      socket.join(chatId.toString());
    } catch (error) {
      console.error("Unable to join chat room:", error.message);
    }
  });

  // socket.on("typing", (room) => socket.in(room).emit("typing"));
  // socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  const emitTypingEvent = async (chatId, eventName) => {
    const chat = await Chat.exists({
      _id: chatId,
      users: socket.userId,
    });

    if (chat) {
      socket.to(chatId.toString()).emit(eventName);
    }
  };

  socket.on("typing", (chatId) => {
    emitTypingEvent(chatId, "typing").catch(console.error);
  });

  socket.on("stop typing", (chatId) => {
    emitTypingEvent(chatId, "stop typing").catch(console.error);
  });

  // socket.on("new message", (newMessageReceived) => {
  //   console.log("🔥 NEW MESSAGE EVENT RECEIVED");

  //   let chat = newMessageReceived.chat;

  //   if (!chat || !chat.users) {
  //     return console.log("❌ Chat not defined");
  //   }

  //   chat.users.forEach((u) => {
  //     const userId = u._id ? u._id.toString() : u.toString();
  //     const senderId = newMessageReceived.sender?._id?.toString();

  //     if (userId === senderId) return;

  //     socket.to(userId).emit("message received", newMessageReceived);
  //   });

  //   console.log("📤 Emitting to chat room:", chat._id.toString());
  // });

  socket.on("new message", async (messageData) => {
    try {
      const message = await Message.findById(messageData?._id)
        .populate("sender", "name email")
        .populate({
          path: "chat",
          populate: { path: "users", select: "name email" },
        });

      if (!message || message.sender._id.toString() !== socket.userId) {
        return;
      }

      for (const participant of message.chat.users) {
        const participantId = participant._id.toString();

        if (participantId !== socket.userId) {
          socket.to(participantId).emit("message received", message);
        }
      }
    } catch (error) {
      console.error("Unable to broadcast message:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    if (socket.userId) {
      onLineUsers.delete(socket.userId);

      io.emit("online users updated", Array.from(onLineUsers.keys()));
    }
  });

  // socket.off("setup", () => {
  //   console.log("User Disconnected");
  //   socket.leave(userData._id);
  // });
});

app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

connectDB();

app.get("/", (req, res) => {
  res.send("API is running..");
});

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const { protect } = require("./middleware/authMiddleware");

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You accessed protected route",
    user: req.user,
  });
});
