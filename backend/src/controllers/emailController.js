const prisma = require('../prismaClient');

// fetch all emails with their related data
exports.getAllEmails = async (req, res) => {
  try {
    // getting emails in reverse order so newest ones show first
    const emails = await prisma.email.findMany({
      include: { actionItems: true, drafts: true, chats: true },
      orderBy: { id: 'desc' }
    });
    res.json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
};

// get a single email by its id
exports.getEmailById = async (req, res) => {
  try {
    const { id } = req.params;
    const email = await prisma.email.findUnique({
      where: { id: parseInt(id) },
      include: { actionItems: true, drafts: true, chats: true }
    });
    
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    res.json(email);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
};

// lets user manually change email category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    
    const updated = await prisma.email.update({
      where: { id: parseInt(id) },
      data: { category },
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};
