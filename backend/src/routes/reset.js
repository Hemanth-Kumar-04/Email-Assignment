const express = require("express");
const prisma = require("../prismaClient");
const fs = require("fs");
const path = require("path");

const router = express.Router();

//Delete all data from database

router.delete("/all", async (req, res) => {
  try {
    // Delete in correct order to avoid foreign key constraints
    await prisma.chatMessage.deleteMany({});
    await prisma.draft.deleteMany({});
    await prisma.actionItem.deleteMany({});
    await prisma.email.deleteMany({});
    await prisma.prompt.deleteMany({});

    res.json({ 
      message: "All data deleted successfully",
      deleted: {
        chatMessages: "all",
        drafts: "all",
        actionItems: "all",
        emails: "all",
        prompts: "all"
      }
    });
  } catch (error) {
    console.error("Delete all error:", error);
    res.status(500).json({ 
      error: "Failed to delete data", 
      details: error.message 
    });
  }
});

// Seeding database with default data
router.post("/seed", async (req, res) => {
  try {
    let promptsCreated = 0;
    let emailsCreated = 0;

    // Seed prompts
    const prompts = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/defaultPrompts.json"))
    );
    
    for (const [name, content] of Object.entries(prompts)) {
      await prisma.prompt.upsert({
        where: { name },
        update: { content },
        create: { name, content }
      });
      promptsCreated++;
    }

    // Seed emails
    const emails = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/mockEmails.json"))
    );
    
    for (const email of emails) {
      await prisma.email.create({ data: email });
      emailsCreated++;
    }

    res.json({ 
      message: "Database seeded successfully",
      created: {
        prompts: promptsCreated,
        emails: emailsCreated
      }
    });
  } catch (error) {
    console.error("Seed error:", error);
    res.status(500).json({ 
      error: "Failed to seed database", 
      details: error.message 
    });
  }
});

//Delete all data and reseed with fresh data

router.post("/full", async (req, res) => {
  try {
    // Delete all data
    await prisma.chatMessage.deleteMany({});
    await prisma.draft.deleteMany({});
    await prisma.actionItem.deleteMany({});
    await prisma.email.deleteMany({});
    await prisma.prompt.deleteMany({});

    let promptsCreated = 0;
    let emailsCreated = 0;

    // Seed prompts
    const prompts = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/defaultPrompts.json"))
    );
    
    for (const [name, content] of Object.entries(prompts)) {
      await prisma.prompt.create({ data: { name, content } });
      promptsCreated++;
    }

    // Seed emails
    const emails = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/mockEmails.json"))
    );
    
    for (const email of emails) {
      await prisma.email.create({ data: email });
      emailsCreated++;
    }

    res.json({ 
      message: "Full reset completed successfully",
      created: {
        prompts: promptsCreated,
        emails: emailsCreated
      }
    });
  } catch (error) {
    console.error("Full reset error:", error);
    res.status(500).json({ 
      error: "Failed to complete full reset", 
      details: error.message 
    });
  }
});

module.exports = router;
