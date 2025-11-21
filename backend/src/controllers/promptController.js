const prisma = require('../prismaClient');

// Get all prompts
exports.getAllPrompts = async (req, res) => {
  try {
    const prompts = await prisma.prompt.findMany();
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
};

// Update a prompt by name
exports.updatePrompt = async (req, res) => {
  try {
    const { name } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const prompt = await prisma.prompt.update({
      where: { name },
      data: { content }
    });

    res.json(prompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ 
      error: 'Failed to update prompt',
      details: error.message 
    });
  }
};
