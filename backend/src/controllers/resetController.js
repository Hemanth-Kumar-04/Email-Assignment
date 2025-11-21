const prisma = require('../prismaClient');
const mockEmails = require('../data/mockEmails.json');
const defaultPrompts = require('../data/defaultPrompts.json');

// Delete all data
exports.deleteAll = async (req, res) => {
  try {
    await prisma.chatMessage.deleteMany();
    await prisma.draft.deleteMany();
    await prisma.actionItem.deleteMany();
    await prisma.email.deleteMany();
    
    res.json({ 
      success: true, 
      message: 'All data deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).json({ 
      error: 'Failed to delete data',
      details: error.message 
    });
  }
};

// Seed database
exports.seed = async (req, res) => {
  try {
    // Seed prompts if not exist
    for (const [name, content] of Object.entries(defaultPrompts)) {
      await prisma.prompt.upsert({
        where: { name },
        update: { content },
        create: { name, content }
      });
    }

    // Seed emails
    await prisma.email.deleteMany();
    
    for (const emailData of mockEmails) {
      await prisma.email.create({
        data: {
          sender: emailData.sender,
          email: emailData.email,
          avatar: emailData.avatar,
          subject: emailData.subject,
          body: emailData.body,
          timestamp: emailData.timestamp,
          date: emailData.date,
          read: emailData.read || false,
          processed: false
        }
      });
    }

    res.json({ 
      success: true, 
      message: `Database seeded with ${mockEmails.length} emails and ${defaultPrompts.length} prompts` 
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ 
      error: 'Failed to seed database',
      details: error.message 
    });
  }
};

// Full reset (delete + seed)
exports.full = async (req, res) => {
  try {
    // Delete all
    await prisma.chatMessage.deleteMany();
    await prisma.draft.deleteMany();
    await prisma.actionItem.deleteMany();
    await prisma.email.deleteMany();
    
    // Seed
    for (const [name, content] of Object.entries(defaultPrompts)) {
      await prisma.prompt.upsert({
        where: { name },
        update: { content },
        create: { name, content }
      });
    }

    for (const emailData of mockEmails) {
      await prisma.email.create({
        data: {
          sender: emailData.sender,
          email: emailData.email,
          avatar: emailData.avatar,
          subject: emailData.subject,
          body: emailData.body,
          timestamp: emailData.timestamp,
          date: emailData.date,
          read: emailData.read || false,
          processed: false
        }
      });
    }

    res.json({ 
      success: true, 
      message: 'Database reset and seeded successfully' 
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ 
      error: 'Failed to reset database',
      details: error.message 
    });
  }
};
