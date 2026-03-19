require("dotenv").config();
const PORT = process.env.PORT || 5000;

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
  pingTimeout: 60000,
  cors:{
    origin: "*",
  },
});

app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

connectDB();

app.get("/", (req, res) => {
  res.send("API is running..");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const { protect } = require("./middleware/authMiddleware");

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You accessed protected route",
    user: req.user,
  });
});
