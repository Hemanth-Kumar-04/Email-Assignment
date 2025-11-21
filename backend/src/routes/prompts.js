const express = require("express");
const router = express.Router();
const promptController = require('../controllers/promptController');

// getting all prompts
router.get("/", promptController.getAllPrompts);
// updating so using put to create prompt
router.put("/:name", promptController.updatePrompt);

module.exports = router;
