const express = require("express");
const prisma = require("../prismaClient");
const { runLLM } = require("../services/llmService");

const router = express.Router();


// this geneerate a draft reply for an email using the auto-reply prompt from DB

router.post("/", async (req, res) => {
  try {
    const { emailId } = req.body;

    if (emailId) {
      // generating draft using LLM
      const email = await prisma.email.findUnique({
        where: { id: Number(emailId) }
      });

      if (!email) {
        return res.status(404).json({ error: "Email not found" });
      }

      // Fetching reply generation prompt from database
      const replyPrompt = await prisma.prompt.findUnique({
        where: { name: "replyGeneration" }
      });

      if (!replyPrompt) {
        return res.status(500).json({ 
          error: "Reply generation prompt not found in database" 
        });
      }

      // Generating reply using LLM
      const promptText = `${replyPrompt.content}\n\nOriginal Email:\nFrom: ${email.sender}\nSubject: ${email.subject}\nBody: ${email.body}`;
      const draftBody = await runLLM(promptText);

      // Deleting old drafts for this email (keep only latest)
      await prisma.draft.deleteMany({
        where: { emailId: Number(emailId) }
      });

      // Saving draft to database (NOT sent)
      const draft = await prisma.draft.create({
        data: {
          emailId: Number(emailId),
          to: email.email,
          subject: `Re: ${email.subject}`,
          body: draftBody.trim()
        }
      });

      return res.json(draft);
    } else {
      // Manually draft creation
      const draft = await prisma.draft.create({
        data: req.body
      });
      return res.json(draft);
    }
  } catch (error) {
    console.error("Draft creation error:", error);
    res.status(500).json({ 
      error: "Failed to create draft", 
      details: error.message 
    });
  }
});

// Get all drafts (only latest draft per email)

router.get("/", async (req, res) => {
  try {
    //delete old duplicate drafts, keeping only the latest per email
    const allDrafts = await prisma.draft.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const draftsByEmail = new Map();
    const draftsToDelete = [];
    
    for (const draft of allDrafts) {
      if (draft.emailId) {
        if (!draftsByEmail.has(draft.emailId)) {
          // keeping the first (latest) draft 
          draftsByEmail.set(draft.emailId, draft.id);
        } else {
          // marking older drafts for deletion
          draftsToDelete.push(draft.id);
        }
      }
    }
    
    // deleting old duplicates
    if (draftsToDelete.length > 0) {
      await prisma.draft.deleteMany({
        where: { id: { in: draftsToDelete } }
      });
    }
    
    // now fetching the cleaned up drafts
    const latestDrafts = await prisma.draft.findMany({
      include: { email: true },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(latestDrafts);
  } catch (error) {
    console.error("Failed to fetch drafts:", error);
    res.status(500).json({ error: "Failed to fetch drafts" });
  }
});

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
