const express = require("express");
const router = express.Router();
const draftController = require('../controllers/draftController');
const prisma = require("../prismaClient");

// this geneerate a draft reply for an email using the auto-reply prompt from DB
router.post("/", draftController.createDraft);

// Get all drafts (only latest draft per email)
router.get("/", draftController.getAllDrafts);

//updating a draft
router.put("/:id", async (req, res) => {
  try {
    const draft = await prisma.draft.update({
      where: { id: Number(req.params.id) },
      data: req.body
    });
    res.json(draft);
  } catch (error) {
    res.status(500).json({ error: "Failed to update draft" });
  }
});

// delete a draft
router.delete("/:id", async (req, res) => {
  try {
    await prisma.draft.delete({
      where: { id: Number(req.params.id) }
    });
    res.json({ message: "Draft deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete draft" });
  }
});

module.exports = router;
