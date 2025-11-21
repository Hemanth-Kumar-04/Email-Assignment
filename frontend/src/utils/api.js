const API_BASE = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

// Helper to call backend API
async function callAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error || data.details || `API Error: ${response.status}`;
      throw new Error(errorMsg);
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Email APIs
export const emailAPI = {
  getAll: () => callAPI('/emails'),
  getById: (id) => callAPI(`/emails/${id}`)
};

// Draft APIs
export const draftAPI = {
  getAll: () => callAPI('/drafts'),
  create: (emailId) => callAPI('/drafts', {
    method: 'POST',
    body: JSON.stringify({ emailId })
  })
};

// Prompt APIs
export const promptAPI = {
  getAll: () => callAPI('/prompts'),
  update: (name, content) => callAPI(`/prompts/${name}`, {
    method: 'PUT',
    body: JSON.stringify({ content })
  })
};

// Chat APIs
export const chatAPI = {
  sendMessage: (emailId, message) => callAPI(`/chat/${emailId}`, {
    method: 'POST',
    body: JSON.stringify({ message })
  })
};

// Ingest APIs
export const ingestAPI = {
  processInbox: () => callAPI('/ingest', { method: 'POST' })
};

// Reset APIs
export const resetAPI = {
  deleteAll: () => callAPI('/reset/all', { method: 'DELETE' }),
  seed: () => callAPI('/reset/seed', { method: 'POST' }),
  full: () => callAPI('/reset/full', { method: 'POST' })
};
