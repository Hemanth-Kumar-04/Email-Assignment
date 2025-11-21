const express = require("express");
const router = express.Router();
const promptController = require('../controllers/promptController');

// getting all prompts
router.get("/", promptController.getAllPrompts);

// getting a single prompt by name
router.get("/:name", async (req, res) => {
  const prisma = require("../prismaClient");
  const prompt = await prisma.prompt.findUnique({
    where: { name: req.params.name },
  });
  res.json(prompt);
});

// updating so using put to create prompt
router.put("/:name", promptController.updatePrompt);

module.exports = router;
