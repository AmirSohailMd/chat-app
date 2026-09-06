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

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("setup", (userData) => {
    if (!userData?._id) return;

    socket.join(userData._id);
    socket.userId = userData._id;
    onLineUsers.set(userData._id, socket.id);

    socket.emit("connected");

    io.emit("online users updated", Array.from(onLineUsers.keys()));
    console.log("User joined room & is ONLINE: ", userData._id);
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined chat: ", room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    console.log("🔥 NEW MESSAGE EVENT RECEIVED");

    let chat = newMessageReceived.chat;

    if (!chat || !chat.users) {
      return console.log("❌ Chat not defined");
    }

    chat.users.forEach((u) => {
      const userId = u._id ? u._id.toString() : u.toString();
      const senderId = newMessageReceived.sender?._id?.toString();

      if (userId === senderId) return;

      socket.to(userId).emit("message received", newMessageReceived);
    });

    console.log("📤 Emitting to chat room:", chat._id.toString());
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
