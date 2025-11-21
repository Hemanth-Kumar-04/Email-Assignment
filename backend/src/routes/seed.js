const express = require("express");
const router = express.Router();
const seedController = require('../controllers/seedController');

// Load and seed emails from mockEmails json into the db
router.post("/emails", seedController.seedEmails);

/**
 * POST /api/seed/prompts
 * Load and seed prompts from defaultPrompts.json into the database
 */
router.post("/prompts", seedController.seedPrompts);

/**
 * POST /api/seed/all
 * Seed both emails and prompts
 */
router.post("/all", seedController.seedAll);

/**
 * DELETE /api/seed/reset
 * Clear all data and reseed from JSON files
 */
router.delete("/reset", seedController.resetAndSeed);

module.exports = router;
