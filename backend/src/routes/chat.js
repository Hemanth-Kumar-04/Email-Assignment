const express = require("express");
const router = express.Router();
const chatController = require('../controllers/chatController');

// Chat with LLM about a specific email 
router.post("/:id", chatController.sendMessage);

module.exports = router;
