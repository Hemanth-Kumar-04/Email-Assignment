const express = require("express");
const router = express.Router();
const resetController = require('../controllers/resetController');

//Delete all data from database
router.delete("/all", resetController.deleteAll);

// Seeding database with default data
router.post("/seed", resetController.seed);

//Delete all data and reseed with fresh data
router.post("/full", resetController.full);

module.exports = router;
