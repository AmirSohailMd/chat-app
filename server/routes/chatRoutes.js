const express = require("express");
const { accessChat } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/" ,protect, accessChat);

module.exports = router;