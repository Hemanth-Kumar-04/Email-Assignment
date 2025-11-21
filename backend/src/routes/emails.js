const express = require("express");
const router = express.Router();
const emailController = require('../controllers/emailController');

// getng all emails
router.get("/", emailController.getAllEmails);

// get single email
router.get("/:id", emailController.getEmailById);

// updating email category
router.put("/:id/category", emailController.updateCategory);

module.exports = router;
