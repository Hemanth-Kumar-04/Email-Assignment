const prisma = require('../prismaClient');
const { runLLM } = require('../services/llmService');

// Get all drafts
exports.getAllDrafts = async (req, res) => {
  try {
    const drafts = await prisma.draft.findMany({
      include: { email: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Clean up duplicate drafts (keep only latest per email)
    const seenEmails = new Set();
    const uniqueDrafts = drafts.filter(draft => {
      if (draft.emailId && seenEmails.has(draft.emailId)) {
        return false;
      }
      if (draft.emailId) seenEmails.add(draft.emailId);
      return true;
    });
    
    res.json(uniqueDrafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
};

// Create a new draft
exports.createDraft = async (req, res) => {
  try {
    const { emailId } = req.body;
    
    if (!emailId) {
      return res.status(400).json({ error: 'emailId is required' });
    }

    const email = await prisma.email.findUnique({
      where: { id: parseInt(emailId) }
    });

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Delete existing drafts for this email to avoid duplicates
    await prisma.draft.deleteMany({
      where: { emailId: parseInt(emailId) }
    });

    // Fetch reply generation prompt from database
    const replyPrompt = await prisma.prompt.findUnique({
      where: { name: 'replyGeneration' }
    });

    if (!replyPrompt) {
      return res.status(500).json({ 
        error: 'Reply generation prompt not found in database' 
      });
    }

    const promptText = `${replyPrompt.content}\n\nOriginal Email:\nFrom: ${email.sender}\nSubject: ${email.subject}\nBody: ${email.body}`;
    const draftBody = await runLLM(promptText);

    const draft = await prisma.draft.create({
      data: {
        emailId: parseInt(emailId),
        to: email.sender,
        subject: `Re: ${email.subject}`,
        body: draftBody,
        metadata: JSON.stringify({ generatedAt: new Date().toISOString() })
      },
      include: { email: true }
    });

    res.json(draft);
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ 
      error: 'Failed to create draft',
      details: error.message 
    });
  }
};
