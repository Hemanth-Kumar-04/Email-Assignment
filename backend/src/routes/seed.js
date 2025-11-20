const express = require("express");
const prisma = require("../prismaClient");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Load and seed emails from mockEmails json into the db

router.post("/emails", async (req, res) => {
  try {
    const mockEmailsPath = path.join(__dirname, "../data/mockEmails.json");
    const emails = JSON.parse(fs.readFileSync(mockEmailsPath, "utf-8"));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const emailData of emails) {
      // chk if email already exists
      const existingEmail = await prisma.email.findFirst({
        where: {
          email: emailData.email,
          subject: emailData.subject
        }
      });

      if (existingEmail) {
        // update existing email
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
        // create new email
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
      skipped,
      total: emails.length
    });

  } catch (error) {
    console.error("Seed emails error:", error);
    res.status(500).json({
      error: "Failed to seed emails",
      details: error.message
    });
  }
});

/**
 * POST /api/seed/prompts
 * Load and seed prompts from defaultPrompts.json into the database
 */
router.post("/prompts", async (req, res) => {
  try {
    const promptsPath = path.join(__dirname, "../data/defaultPrompts.json");
    const prompts = JSON.parse(fs.readFileSync(promptsPath, "utf-8"));

    let created = 0;
    let updated = 0;

    for (const [name, content] of Object.entries(prompts)) {
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
      total: Object.keys(prompts).length
    });

  } catch (error) {
    console.error("Seed prompts error:", error);
    res.status(500).json({
      error: "Failed to seed prompts",
      details: error.message
    });
  }
});

/**
 * POST /api/seed/all
 * Seed both emails and prompts
 */
router.post("/all", async (req, res) => {
  try {
    // Seed prompts
    const promptsPath = path.join(__dirname, "../data/defaultPrompts.json");
    const prompts = JSON.parse(fs.readFileSync(promptsPath, "utf-8"));

    let promptsCreated = 0;
    let promptsUpdated = 0;

    for (const [name, content] of Object.entries(prompts)) {
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
    const mockEmailsPath = path.join(__dirname, "../data/mockEmails.json");
    const emails = JSON.parse(fs.readFileSync(mockEmailsPath, "utf-8"));

    let emailsCreated = 0;
    let emailsUpdated = 0;

    for (const emailData of emails) {
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
        total: Object.keys(prompts).length
      },
      emails: {
        created: emailsCreated,
        updated: emailsUpdated,
        total: emails.length
      }
    });

  } catch (error) {
    console.error("Seed all error:", error);
    res.status(500).json({
      error: "Failed to seed database",
      details: error.message
    });
  }
});

/**
 * DELETE /api/seed/reset
 * Clear all data and reseed from JSON files
 */
router.delete("/reset", async (req, res) => {
  try {
    // Delete all data
    await prisma.chatMessage.deleteMany();
    await prisma.draft.deleteMany();
    await prisma.actionItem.deleteMany();
    await prisma.email.deleteMany();
    await prisma.prompt.deleteMany();

    // Seed prompts
    const promptsPath = path.join(__dirname, "../data/defaultPrompts.json");
    const prompts = JSON.parse(fs.readFileSync(promptsPath, "utf-8"));

    for (const [name, content] of Object.entries(prompts)) {
      await prisma.prompt.create({
        data: { name, content }
      });
    }

    // Seed emails
    const mockEmailsPath = path.join(__dirname, "../data/mockEmails.json");
    const emails = JSON.parse(fs.readFileSync(mockEmailsPath, "utf-8"));

    for (const emailData of emails) {
      await prisma.email.create({
        data: emailData
      });
    }

    res.json({
      message: "Database reset and reseeded successfully",
      prompts: Object.keys(prompts).length,
      emails: emails.length
    });

  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({
      error: "Failed to reset database",
      details: error.message
    });
  }
});

module.exports = router;
