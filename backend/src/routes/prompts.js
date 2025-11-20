const express = require("express");
const prisma = require("../prismaClient");

const router = express.Router();

// getting all prompts
router.get("/", async (req, res) => {
  const prompts = await prisma.prompt.findMany();
  res.json(prompts);
});

// getting a single prompt by name
router.get("/:name", async (req, res) => {
  const prompt = await prisma.prompt.findUnique({
    where: { name: req.params.name },
  });
  res.json(prompt);
});

// updating so using put to create prompt
router.put("/:name", async (req, res) => {
  const { content } = req.body;
  const updatedPrompt = await prisma.prompt.upsert({
    where: { name: req.params.name },
    update: { content },
    create: { name: req.params.name, content },
  });
  res.json(updatedPrompt);
});

module.exports = router;
