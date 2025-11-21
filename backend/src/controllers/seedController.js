const prisma = require('../prismaClient');
const mockEmails = require('../data/mockEmails.json');
const defaultPrompts = require('../data/defaultPrompts.json');

// Seed emails
exports.seedEmails = async (req, res) => {
  try {
    let created = 0;
    let updated = 0;

    for (const emailData of mockEmails) {
      const existingEmail = await prisma.email.findFirst({
        where: {
          email: emailData.email,
          subject: emailData.subject
        }
      });

      if (existingEmail) {
        await prisma.email.update({
          where: { id: existingEmail.id },
          data: {
            sender: emailData.sender,
            body: emailData.body,
            timestamp: emailData.timestamp,
            date: emailData.date,
            read: emailData.read,
            avatar: emailData.avatar
          }
        });
        updated++;
      } else {
        await prisma.email.create({
          data: emailData
        });
        created++;
      }
    }

    res.json({
      message: "Email seeding complete",
      created,
      updated,
      total: mockEmails.length
    });
  } catch (error) {
    console.error("Seed emails error:", error);
    res.status(500).json({
      error: "Failed to seed emails",
      details: error.message
    });
  }
};

// Seed prompts
exports.seedPrompts = async (req, res) => {
  try {
    let created = 0;
    let updated = 0;

    for (const [name, content] of Object.entries(defaultPrompts)) {
      const existingPrompt = await prisma.prompt.findUnique({
        where: { name }
      });

      if (existingPrompt) {
        await prisma.prompt.update({
          where: { name },
          data: { content }
        });
        updated++;
      } else {
        await prisma.prompt.create({
          data: { name, content }
        });
        created++;
      }
    }

    res.json({
      message: "Prompt seeding complete",
      created,
      updated,
      total: Object.keys(defaultPrompts).length
    });
  } catch (error) {
    console.error("Seed prompts error:", error);
    res.status(500).json({
      error: "Failed to seed prompts",
      details: error.message
    });
  }
};

// Seed all (emails + prompts)
exports.seedAll = async (req, res) => {
  try {
    // Seed prompts
    let promptsCreated = 0;
    let promptsUpdated = 0;

    for (const [name, content] of Object.entries(defaultPrompts)) {
      const existingPrompt = await prisma.prompt.findUnique({
        where: { name }
      });

      if (existingPrompt) {
        await prisma.prompt.update({
          where: { name },
          data: { content }
        });
        promptsUpdated++;
      } else {
        await prisma.prompt.create({
          data: { name, content }
        });
        promptsCreated++;
      }
    }

    // Seed emails
    let emailsCreated = 0;
    let emailsUpdated = 0;

    for (const emailData of mockEmails) {
      const existingEmail = await prisma.email.findFirst({
        where: {
          email: emailData.email,
          subject: emailData.subject
        }
      });

      if (existingEmail) {
        await prisma.email.update({
          where: { id: existingEmail.id },
          data: {
            sender: emailData.sender,
            body: emailData.body,
            timestamp: emailData.timestamp,
            date: emailData.date,
            read: emailData.read,
            avatar: emailData.avatar
          }
        });
        emailsUpdated++;
      } else {
        await prisma.email.create({
          data: emailData
        });
        emailsCreated++;
      }
    }

    res.json({
      message: "Full seeding complete",
      prompts: {
        created: promptsCreated,
        updated: promptsUpdated,
        total: Object.keys(defaultPrompts).length
      },
      emails: {
        created: emailsCreated,
        updated: emailsUpdated,
        total: mockEmails.length
      }
    });
  } catch (error) {
    console.error("Seed all error:", error);
    res.status(500).json({
      error: "Failed to seed database",
      details: error.message
    });
  }
};

// Reset and reseed
exports.resetAndSeed = async (req, res) => {
  try {
    // Delete all data
    await prisma.chatMessage.deleteMany();
    await prisma.draft.deleteMany();
    await prisma.actionItem.deleteMany();
    await prisma.email.deleteMany();
    await prisma.prompt.deleteMany();

    // Seed prompts
    for (const [name, content] of Object.entries(defaultPrompts)) {
      await prisma.prompt.create({
        data: { name, content }
      });
    }

    // Seed emails
    for (const emailData of mockEmails) {
      await prisma.email.create({
        data: emailData
      });
    }

    res.json({
      message: "Database reset and reseeded successfully",
      prompts: Object.keys(defaultPrompts).length,
      emails: mockEmails.length
    });
  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({
      error: "Failed to reset database",
      details: error.message
    });
  }
};
