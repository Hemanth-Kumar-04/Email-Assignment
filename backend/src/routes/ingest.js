const express = require("express");
const router = express.Router();
const ingestController = require('../controllers/ingestController');

// Load mock emails and process them with LLM in batches using dynamic prompts from DB
router.post("/", ingestController.processInbox);

module.exports = router;
