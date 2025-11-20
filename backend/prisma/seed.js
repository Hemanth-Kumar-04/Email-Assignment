const prisma = require('../src/prismaClient');
const fs = require('fs');
const path = require('path');

async function main() {
  const emailsRaw = fs.readFileSync(path.join(__dirname, '../src/data/mockEmails.json'), 'utf8');
  const promptsRaw = fs.readFileSync(path.join(__dirname, '../src/data/defaultPrompts.json'), 'utf8');

  const emails = JSON.parse(emailsRaw);
  const prompts = JSON.parse(promptsRaw);

  console.log("Seeding prompts...");
  for (const [k, v] of Object.entries(prompts)) {
    await prisma.prompt.upsert({
      where: { name: k },
      update: { content: v },
      create: { name: k, content: v }
    });
  }

  console.log("Seeding emails...");
  for (const e of emails) {
    await prisma.email.create({
      data: {
        sender: e.sender,
        email: e.email,
        avatar: e.avatar,
        subject: e.subject,
        body: e.body,
        timestamp: e.timestamp,
        date: e.date,
        read: !!e.read
      }
    });
  }

  console.log("Seed finished.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
