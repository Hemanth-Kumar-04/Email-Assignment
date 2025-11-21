require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const prisma = require('./prismaClient');
const fs = require('fs');
const path = require('path');

const promptsRouter = require('./routes/prompts');
const emailsRouter = require('./routes/emails');
const draftsRouter = require('./routes/drafts');
const chatRouter = require('./routes/chat');
const ingestRouter = require('./routes/ingest');
const resetRouter = require('./routes/reset');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// automatically seeds database on first startup if empty
async function autoSeed() {
  const promptCount = await prisma.prompt.count();
  const emailCount = await prisma.email.count();

  // seed prompts
  if (promptCount === 0) {
    const prompts = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data/defaultPrompts.json"))
    );
    for (const [name, content] of Object.entries(prompts)) {
      await prisma.prompt.create({ data: { name, content } });
    }
    console.log(" Default prompts seeded.");
  }

  // seeding emails
  if (emailCount === 0) {
    const emails = JSON.parse(
      fs.readFileSync(path.join(__dirname, "data/mockEmails.json"))
    );
    for (const email of emails) {
      await prisma.email.create({ data: email });
    }
    console.log(" Mock emails seeded.");
  }
}

app.use("/api/prompts", promptsRouter);//working
app.use("/api/emails", emailsRouter);//working
app.use("/api/drafts", draftsRouter);//wrkng
app.use("/api/chat", chatRouter);//working
app.use("/api/ingest", ingestRouter);//workng
app.use("/api/reset", resetRouter);//working

app.get("/health", (req, res) => res.json({ status: "OK" }));

// starting server after seeding
autoSeed().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
});
