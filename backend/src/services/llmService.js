const { GoogleGenerativeAI } = require("@google/generative-ai");

// loading multiple api keys to rotate for round robbin
const apiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(key => key && key !== "your-second-api-key-here" && key !== "your-third-api-key-here"); // Remove undefined/null/placeholder keys

let currentKeyIndex = 0;


const failedKeys = new Set();

//  Get next valid API key using round-robin strategy
function getNextApiKey() {
  if (apiKeys.length === 0) {
    throw new Error("No Gemini API keys configured in .env file");
  }
  
  // find next non-failed key
  let attempts = 0;
  while (attempts < apiKeys.length) {
    const key = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    
    if (!failedKeys.has(key)) {
      return key;
    }
    attempts++;
  }
  console.warn("All API keys have failed, resetting failed keys cache");
  failedKeys.clear();
  return apiKeys[0];
}

// mark an API key as failed
 
function markKeyAsFailed(key) {
  failedKeys.add(key);
  console.error(`API key ending with ...${key.slice(-4)} marked as invalid`);
}


async function runLLM(prompt, jsonMode = false) {
  const apiKey = getNextApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: jsonMode ? {
        responseMimeType: "application/json"
      } : undefined
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("LLM Error:", error.message);
    
 
    if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
      markKeyAsFailed(apiKey);
      throw new Error("Invalid Gemini API key. Please check your GEMINI_API_KEY in .env file");
    } else if (error.message.includes('quota')) {
      throw new Error("Gemini API quota exceeded. Please check your API usage");
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      throw new Error("Network error connecting to Gemini API. Check your internet connection");
    }
    
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

//process multiple emails in a single LLM call for batch categorization
async function batchCategorizeEmails(emails, categorizationPrompt) {
  const apiKey = getNextApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  //building batch prompt
  let batchPrompt = `${categorizationPrompt}\n\nCategorize the following ${emails.length} emails. Return a JSON array with categories in the same order.\n\n`;
  
  emails.forEach((email, index) => {
    batchPrompt += `Email ${index + 1}:\nSubject: ${email.subject}\nBody: ${email.body}\n\n`;
  });
  
  batchPrompt += `Return ONLY a JSON array of category names, one for each email in order. Example: ["Work", "Spam", "Personal"]`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(batchPrompt);
    const response = await result.response;
    const categories = JSON.parse(response.text());
    
    if (!Array.isArray(categories) || categories.length !== emails.length) {
      throw new Error("Invalid batch response format");
    }
    
    return categories;
  } catch (error) {
    console.error("Batch categorization error:", error.message);
    
    // Mark key as failed if invalid
    if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
      markKeyAsFailed(apiKey);
    }
    
    throw new Error(`Batch categorization failed: ${error.message}`);
  }
}

// process multiple emails in a single LLM call for batch action extraction

async function batchExtractActions(emails, actionPrompt) {
  const apiKey = getNextApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);

  // buuild batch prompt
  let batchPrompt = `${actionPrompt}\n\nExtract action items from the following ${emails.length} emails. Return a JSON array where each element is an array of action items for that email.\n\n`;
  
  emails.forEach((email, index) => {
    batchPrompt += `Email ${index + 1}:\nSubject: ${email.subject}\nBody: ${email.body}\n\n`;
  });
  
  batchPrompt += `Return ONLY a JSON array of arrays. Each inner array contains action items for that email. Example: [[{"task":"Review report","priority":"high"}], [], [{"task":"Reply","priority":"low"}]]`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(batchPrompt);
    const response = await result.response;
    const actionsArray = JSON.parse(response.text());
    
    if (!Array.isArray(actionsArray) || actionsArray.length !== emails.length) {
      throw new Error("Invalid batch response format");
    }
    
    return actionsArray;
  } catch (error) {
    console.error("Batch action extraction error:", error.message);
    
    // key failed marking
    if (error.message.includes('API key not valid') || error.message.includes('API_KEY_INVALID')) {
      markKeyAsFailed(apiKey);
    }
    
    throw new Error(`Batch action extraction failed: ${error.message}`);
  }
}

module.exports = { runLLM, batchCategorizeEmails, batchExtractActions };
