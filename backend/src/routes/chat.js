const express = require("express");
const prisma = require("../prismaClient");
const { runLLM } = require("../services/llmService");

const router = express.Router();


// Chat with LLM about a specific email 

router.post("/:emailId", async (req, res) => {
  try {
    const { message } = req.body;
    const emailId = Number(req.params.emailId);

    // Fetching email context
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { actionItems: true, drafts: true }
    });

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Saving user message
    await prisma.chatMessage.create({
      data: { emailId, role: "user", text: message }
    });

    // Building context for LLM
    const context = `
Email Context:
- Subject: ${email.subject}
- From: ${email.sender} (${email.email})
- Body: ${email.body}
- Category: ${email.category || "Not categorized"}
- Action Items: ${email.actionItems.map(a => `${a.task} (${a.priority})`).join(", ") || "None"}

User Question: ${message}

Provide a helpful, concise answer based on the email context above.`;

    const replyText = await runLLM(context);

    // Saving assistant reply
    const reply = await prisma.chatMessage.create({
      data: { emailId, role: "assistant", text: replyText }
    });

    res.json(reply);
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});



module.exports = router;
