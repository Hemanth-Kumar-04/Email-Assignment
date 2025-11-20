const express = require("express");
const prisma = require("../prismaClient");
const { runLLM, batchCategorizeEmails, batchExtractActions } = require("../services/llmService");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Batch size for processing emails
const BATCH_SIZE = 5;

// Load mock emails and process them with LLM in batches using dynamic prompts from DB
router.post("/", async (req, res) => {
  try {
    // 1 Loading mock emails
    const mockEmailsPath = path.join(__dirname, "../data/mockEmails.json");
    const emails = JSON.parse(fs.readFileSync(mockEmailsPath, "utf-8"));

    // 2  Fetching current prompts from database
    const categorizationPrompt = await prisma.prompt.findUnique({
      where: { name: "categorization" }
    });
    
    const actionExtractionPrompt = await prisma.prompt.findUnique({
      where: { name: "actionExtraction" }
    });

    if (!categorizationPrompt || !actionExtractionPrompt) {
      return res.status(500).json({ 
        error: "Required prompts not found in database. Please seed the database first." 
      });
    }

    const results = [];
    
    // 3 Filtering out already processed emails
    const unprocessedEmails = [];
    for (const emailData of emails) {
      const existingEmail = await prisma.email.findFirst({
        where: { 
          email: emailData.email,
          subject: emailData.subject 
        }
      });

      if (existingEmail && existingEmail.processed) {
        results.push({ 
          email: existingEmail.subject, 
          status: "skipped", 
          reason: "already processed" 
        });
      } else {
        unprocessedEmails.push({ data: emailData, existing: existingEmail });
      }
    }

    // 4 Processing emails in batches
    for (let i = 0; i < unprocessedEmails.length; i += BATCH_SIZE) {
      const batch = unprocessedEmails.slice(i, i + BATCH_SIZE);
      const batchEmails = batch.map(item => item.data);
      
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} emails`);
      
      try {
        // categorize emails (1 API call for 5 emails)
        const categories = await batchCategorizeEmails(batchEmails, categorizationPrompt.content);
        
        // extract action items (1 API call for 5 emails)
        const actionsArray = await batchExtractActions(batchEmails, actionExtractionPrompt.content);
        
        // saving results for each email in the batch
        for (let j = 0; j < batch.length; j++) {
          const emailData = batch[j].data;
          const existingEmail = batch[j].existing;
          const category = categories[j];
          const actionItems = actionsArray[j] || [];
          
          // save or update email
          const savedEmail = existingEmail 
            ? await prisma.email.update({
                where: { id: existingEmail.id },
                data: {
                  category: typeof category === 'string' ? category.trim() : 'Other',
                  processed: true
                }
              })
            : await prisma.email.create({
                data: {
                  ...emailData,
                  category: typeof category === 'string' ? category.trim() : 'Other',
                  processed: true
                }
              });

          // save action items
          if (actionItems.length > 0) {
            await prisma.actionItem.deleteMany({
              where: { emailId: savedEmail.id }
            });

            for (const item of actionItems) {
              await prisma.actionItem.create({
                data: {
                  emailId: savedEmail.id,
                  task: item.task || "Unnamed task",
                  priority: item.priority || "Medium"
                }
              });
            }
          }

          results.push({
            email: savedEmail.subject,
            category: typeof category === 'string' ? category.trim() : 'Other',
            actionItemsCount: actionItems.length,
            status: "processed"
          });
        }
      } catch (batchError) {
        console.error(`Batch processing error:`, batchError.message);
        
        // falling back to individual processing for this batch if batch fails
        for (const item of batch) {
          const emailData = item.data;
          const existingEmail = item.existing;
          
          try {
            const categoryPrompt = `${categorizationPrompt.content}\n\nEmail Subject: ${emailData.subject}\nEmail Body: ${emailData.body}`;
            const category = await runLLM(categoryPrompt);

            const actionPrompt = `${actionExtractionPrompt.content}\n\nEmail Subject: ${emailData.subject}\nEmail Body: ${emailData.body}\n\nReturn a JSON array of objects with fields: task, priority. If no tasks, return empty array.`;
            const actionItemsText = await runLLM(actionPrompt, true);
            
            let actionItems = [];
            try {
              actionItems = JSON.parse(actionItemsText);
              if (!Array.isArray(actionItems)) {
                actionItems = [];
              }
            } catch (e) {
              console.error("Failed to parse action items:", e);
            }

            const savedEmail = existingEmail 
              ? await prisma.email.update({
                  where: { id: existingEmail.id },
                  data: {
                    category: category.trim(),
                    processed: true
                  }
                })
              : await prisma.email.create({
                  data: {
                    ...emailData,
                    category: category.trim(),
                    processed: true
                  }
                });

            if (actionItems.length > 0) {
              await prisma.actionItem.deleteMany({
                where: { emailId: savedEmail.id }
              });

              for (const act of actionItems) {
                await prisma.actionItem.create({
                  data: {
                    emailId: savedEmail.id,
                    task: act.task || "Unnamed task",
                    priority: act.priority || "Medium"
                  }
                });
              }
            }

            results.push({
              email: savedEmail.subject,
              category: category.trim(),
              actionItemsCount: actionItems.length,
              status: "processed (fallback)"
            });
          } catch (fallbackError) {
            console.error(`Failed to process email ${emailData.subject}:`, fallbackError.message);
            results.push({
              email: emailData.subject,
              status: "failed",
              error: fallbackError.message
            });
          }
        }
      }
    }

    res.json({
      message: "Email ingestion complete",
      batchSize: BATCH_SIZE,
      totalBatches: Math.ceil(unprocessedEmails.length / BATCH_SIZE),
      results
    });

  } catch (error) {
    console.error("Ingest error:", error);
    res.status(500).json({ 
      error: "Failed to ingest emails", 
      details: error.message 
    });
  }
});

module.exports = router;
