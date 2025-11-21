const express = require("express");
const router = express.Router();
const emailController = require('../controllers/emailController');

// getng all emails
router.get("/", emailController.getAllEmails);

module.exports = router;
