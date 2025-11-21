const prisma = require('../prismaClient');
const { batchCategorizeEmails, batchExtractActions } = require('../services/llmService');
const mockEmails = require('../data/mockEmails.json');

const BATCH_SIZE = 5;

// this processes all emails through AI to categorize and extract tasks
exports.processInbox = async (req, res) => {
  try {
    // need these prompts to tell AI what to do
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

    // clear old emails first
    await prisma.email.deleteMany();

    // processing in batches of 5 to avoid hitting API limits
    const totalBatches = Math.ceil(mockEmails.length / BATCH_SIZE);
    let processedCount = 0;

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, mockEmails.length);
      const batchEmails = mockEmails.slice(start, end);

      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${batchEmails.length} emails)...`);

      try {
        // Categorize emails (1 API call for 5 emails)
        const categories = await batchCategorizeEmails(batchEmails, categorizationPrompt.content);
        
        // Extract action items (1 API call for 5 emails)
        const actionsArray = await batchExtractActions(batchEmails, actionExtractionPrompt.content);

        // Save to database
        for (let j = 0; j < batchEmails.length; j++) {
          const emailData = batchEmails[j];
          const category = categories[j];
          const actionItems = actionsArray[j] || [];

          const email = await prisma.email.create({
            data: {
              sender: emailData.sender,
              email: emailData.email,
              avatar: emailData.avatar,
              subject: emailData.subject,
              body: emailData.body,
              timestamp: emailData.timestamp,
              date: emailData.date,
              read: emailData.read || false,
              category: typeof category === 'string' ? category.trim() : 'Other',
              processed: true,
              actionItems: {
                create: actionItems.map(item => ({
                  task: item.task || "Unknown task",
                  priority: item.priority || "Medium"
                }))
              }
            }
          });

          processedCount++;
        }

        console.log(`Batch ${batchIndex + 1} completed.`);
      } catch (batchError) {
        console.error(`Error processing batch ${batchIndex + 1}:`, batchError);
        
        // Fallback: process individually
        for (const emailData of batchEmails) {
          try {
            const categoryPrompt = `${categorizationPrompt.content}\n\nEmail Subject: ${emailData.subject}\nEmail Body: ${emailData.body}\n\nReturn ONLY the category name.`;
            const category = await callLLM(categoryPrompt);

            const actionPrompt = `${actionExtractionPrompt.content}\n\nEmail Subject: ${emailData.subject}\nEmail Body: ${emailData.body}\n\nReturn a JSON array of objects with fields: task, priority. If no tasks, return empty array.`;
            let actionItemsRaw = await callLLM(actionPrompt);
            
            let actionItems = [];
            try {
              actionItemsRaw = actionItemsRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              actionItems = JSON.parse(actionItemsRaw);
              if (!Array.isArray(actionItems)) actionItems = [];
            } catch {
              actionItems = [];
            }

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
                category: typeof category === 'string' ? category.trim() : 'Other',
                processed: true,
                actionItems: {
                  create: actionItems.map(act => ({
                    task: act.task || "Unknown task",
                    priority: act.priority || "Medium"
                  }))
                }
              }
            });

            processedCount++;
          } catch (individualError) {
            console.error(`Failed to process individual email: ${emailData.subject}`, individualError);
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Processed ${processedCount} emails in ${totalBatches} batches`,
      totalEmails: processedCount,
      batchSize: BATCH_SIZE
    });
  } catch (error) {
    console.error('Inbox processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process inbox',
      details: error.message 
    });
  }
};
