const express = require("express");
const prisma = require("../prismaClient");
const router = express.Router();

// getng all emails
router.get("/", async (req, res) => {
  const emails = await prisma.email.findMany({
    include: { actionItems: true, drafts: true, chats: true }
  });
  res.json(emails);
});

// get single email
router.get("/:id", async (req, res) => {
  const email = await prisma.email.findUnique({
    where: { id: Number(req.params.id) },
    include: { actionItems: true, drafts: true, chats: true }
  });
  res.json(email);
});

// updating email category
router.put("/:id/category", async (req, res) => {
  const { category } = req.body;
  const updated = await prisma.email.update({
    where: { id: Number(req.params.id) },
    data: { category },
  });
  res.json(updated);
});

module.exports = router;
