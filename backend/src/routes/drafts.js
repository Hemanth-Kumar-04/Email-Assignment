const express = require("express");
const router = express.Router();
const draftController = require('../controllers/draftController');

// this geneerate a draft reply for an email using the auto-reply prompt from DB
router.post("/", draftController.createDraft);

// Get all drafts (only latest draft per email)
router.get("/", draftController.getAllDrafts);

module.exports = router;
