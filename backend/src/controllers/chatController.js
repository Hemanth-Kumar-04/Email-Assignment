const prisma = require('../prismaClient');
const { runLLM } = require('../services/llmService');

// handles chat messages about a specific email
exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const email = await prisma.email.findUnique({
      where: { id: parseInt(id) },
      include: { actionItems: true, drafts: true }
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        emailId: parseInt(id),
        role: 'user',
        text: message
      }
    });

    // building the context for AI so it knows what email we're talking about
    const prompt = `You are an email assistant. Answer questions about this email:

Subject: ${email.subject}
From: ${email.sender}
Body: ${email.body}
- Category: ${email.category || "Not categorized"}
- Action Items: ${email.actionItems.map(a => `${a.task} (${a.priority})`).join(", ") || "None"}

User question: ${message}

Provide a helpful and concise answer.`;

    const aiResponse = await runLLM(prompt);

    // Save AI response
    const reply = await prisma.chatMessage.create({
      data: {
        emailId: parseInt(id),
        role: 'assistant',
        text: aiResponse
      }
    });

    res.json({ text: aiResponse });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
};
