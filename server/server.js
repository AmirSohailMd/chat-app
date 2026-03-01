require("dotenv").config();
const PORT = process.env.PORT || 5000;

const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const app = express();

app.use(express.json());
app.use("/api/users", userRoutes);

connectDB();

app.get("/", (req, res) => {
  res.send("API is running..");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
