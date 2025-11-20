import { useState, useEffect } from 'react';
import {
  Inbox,
  FileText,
  Settings,
  Search,
  CheckCircle,
  Sparkles,
  Send,
  Loader2,
  MessageSquare,
  PenLine
} from 'lucide-react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

const categoryColors = {
  Important: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  Work: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Newsletter: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  Spam: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  Personal: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  Promotional: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' }
};

// Helper to call backend API
async function callAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Extract error message from backend response
      const errorMsg = data.error || data.details || `API Error: ${response.status}`;
      throw new Error(errorMsg);
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

function App() {
  const [emails, setEmails] = useState([]);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [view, setView] = useState('inbox');
  const [prompts, setPrompts] = useState({});
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMode, setChatMode] = useState('chat');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [emailDrafts, setEmailDrafts] = useState({}); // Store draft text per email ID
  const [editingPrompt, setEditingPrompt] = useState(null); // Track which prompt is being edited

  // Load emails and prompts from backend on mount
  const loadData = async () => {
    setLoading(true);
    try {
      const [emailsData, promptsData, draftsData] = await Promise.all([
        callAPI('/emails'),
        callAPI('/prompts'),
        callAPI('/drafts')
      ]);
      
      setEmails(emailsData || []);
      setDrafts(draftsData || []);
      
      // Convert prompts array to object
      if (promptsData && promptsData.length > 0) {
        const promptsObj = {};
        promptsData.forEach(p => {
          promptsObj[p.name] = p.content;
        });
        setPrompts(promptsObj);
      }
      
      if (emailsData && emailsData.length > 0) {
        setSelectedEmailId(emailsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  const filteredEmails = emails.filter(email =>
    email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const processInbox = async () => {
    setProcessing(true);

    try {
      // Call backend ingest endpoint
      const result = await callAPI('/ingest', { method: 'POST' });
      
      // Fetch updated emails from backend
      const updatedEmails = await callAPI('/emails');
      setEmails(updatedEmails);
      
      console.log('Inbox processed:', result);
    } catch (error) {
      console.error('Failed to process inbox:', error);
    }

    setProcessing(false);
  };

  const handleReset = async () => {
    if (!confirm('Are you sure? This will delete ALL data from the database!')) return;
    
    setProcessing(true);
    try {
      await callAPI('/reset/all', { method: 'DELETE' });
      await loadData();
      alert('Database reset successfully!');
    } catch (error) {
      console.error('Reset failed:', error);
      alert('Failed to reset database: ' + error.message);
    }
    setProcessing(false);
  };

  const handleSeed = async () => {
    setProcessing(true);
    try {
      const result = await callAPI('/reset/seed', { method: 'POST' });
      await loadData();
      console.log('Seeded:', result);
    } catch (error) {
      console.error('Seed failed:', error);
    }
    setProcessing(false);
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !selectedEmail) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsGenerating(true);

    try {
      // Call backend chat endpoint
      const response = await callAPI(`/chat/${selectedEmail.id}`, {
        method: 'POST',
        body: JSON.stringify({ message: currentInput })
      });

      setChatHistory(prev => [...prev, { role: 'assistant', content: response.text }]);
    } catch (error) {
      console.error('Chat failed:', error);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: Unable to connect to backend. Make sure the server is running.'
      }]);
    }

    setIsGenerating(false);
  };

  const handleAutoDraft = async () => {
    if (!selectedEmail) return;

    setIsGenerating(true);

    try {
      // Call backend draft generation endpoint
      const draft = await callAPI('/drafts', {
        method: 'POST',
        body: JSON.stringify({ emailId: selectedEmail.id })
      });

      setDraftText(draft.body);
      
      // Save to email drafts map
      setEmailDrafts(prev => ({ ...prev, [selectedEmail.id]: draft.body }));
      
      // Reload drafts list
      const draftsData = await callAPI('/drafts');
      setDrafts(draftsData || []);
    } catch (error) {
      console.error('Draft generation failed:', error);
      setDraftText('Error: Unable to generate draft. Make sure backend is running.');
    }

    setIsGenerating(false);
  };

  const savePromptToBackend = async (name, content) => {
    try {
      await callAPI(`/prompts/${name}`, {
        method: 'PUT',
        body: JSON.stringify({ content })
      });
      console.log(`Prompt "${name}" saved to backend`);
    } catch (error) {
      console.error(`Failed to save prompt "${name}":`, error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="h-screen bg-gray-50 flex">
        {/* Sidebar - same as main view */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
          
              <span className="text-xl font-bold text-gray-900">Hemanth</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setView('inbox')}
              className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
            >
              <Inbox size={20} />
              <span className="font-medium">Inbox</span>
              <span className="ml-auto bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                {emails.filter(e => !e.read).length}
              </span>
            </button>

            <button 
              onClick={() => setView('drafts')}
              className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
            >
              <FileText size={20} />
              <span className="font-medium">Drafts</span>
              <span className="ml-auto text-xs text-gray-500">{drafts.length}</span>
            </button>

            <button
              onClick={() => setView('settings')}
              className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors bg-indigo-100 text-indigo-600"
            >
              <Settings size={20} />
              <span className="font-medium">Prompt Brain</span>
            </button>

            <div className="pt-6">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase mb-3">Labels</h3>
              <div className="space-y-2">
                {Object.entries(categoryColors).map(([name, colors]) => (
                  <div key={name} className="flex items-center space-x-3 px-4 py-1">
                    <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
                    <span className="text-sm text-gray-700">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-2">
            <div className="flex space-x-2">
              <button
                onClick={handleReset}
                disabled={processing}
                className="flex-1 px-3 py-2 bg-red-50 text-red-700 border-2 border-red-700 text-xs rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Reset DB
              </button>
              <button
                onClick={handleSeed}
                disabled={processing}
                className="flex-1 px-3 py-2 bg-green-50 text-green-700 border-2 border-green-700 text-xs rounded hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Seed DB
              </button>
            </div>
            <button
              onClick={processInbox}
              disabled={processing}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {processing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  
                  <span>Process Inbox</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-white flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
            
              <h1 className="text-xl font-semibold text-gray-900">Prompt Brain Configuration</h1>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Email Categorization Prompt
                  </label>
                  {editingPrompt === 'categorization' ? (
                    <button
                      onClick={() => {
                        savePromptToBackend('categorization', prompts.categorization);
                        setEditingPrompt(null);
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingPrompt('categorization')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingPrompt === 'categorization' ? (
                  <textarea
                    value={prompts.categorization || ''}
                    onChange={(e) => setPrompts(prev => ({ ...prev, categorization: e.target.value }))}
                    className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                ) : (
                  <div className="w-full h-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg overflow-auto font-mono text-sm text-gray-700 whitespace-pre-wrap">
                    {prompts.categorization || 'No prompt set'}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Action Item Extraction Prompt
                  </label>
                  {editingPrompt === 'actionExtraction' ? (
                    <button
                      onClick={() => {
                        savePromptToBackend('actionExtraction', prompts.actionExtraction);
                        setEditingPrompt(null);
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingPrompt('actionExtraction')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingPrompt === 'actionExtraction' ? (
                  <textarea
                    value={prompts.actionExtraction || ''}
                    onChange={(e) => setPrompts(prev => ({ ...prev, actionExtraction: e.target.value }))}
                    className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                ) : (
                  <div className="w-full h-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg overflow-auto font-mono text-sm text-gray-700 whitespace-pre-wrap">
                    {prompts.actionExtraction || 'No prompt set'}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Auto-Reply Draft Prompt
                  </label>
                  {editingPrompt === 'replyGeneration' ? (
                    <button
                      onClick={() => {
                        savePromptToBackend('replyGeneration', prompts.autoReply || prompts.replyGeneration);
                        setEditingPrompt(null);
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingPrompt('replyGeneration')}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingPrompt === 'replyGeneration' ? (
                  <textarea
                    value={prompts.autoReply || prompts.replyGeneration || ''}
                    onChange={(e) => setPrompts(prev => ({ ...prev, autoReply: e.target.value, replyGeneration: e.target.value }))}
                    className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                ) : (
                  <div className="w-full h-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg overflow-auto font-mono text-sm text-gray-700 whitespace-pre-wrap">
                    {prompts.autoReply || prompts.replyGeneration || 'No prompt set'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">Hemanth</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setView('inbox')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
              view === 'inbox' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Inbox size={20} />
            <span className="font-medium">Inbox</span>
            <span className="ml-auto bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
              {emails.filter(e => !e.read).length}
            </span>
          </button>

          <button 
            onClick={() => setView('drafts')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
              view === 'drafts' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText size={20} />
            <span className="font-medium">Drafts</span>
            <span className="ml-auto text-xs text-gray-500">{drafts.length}</span>
          </button>

          <button
            onClick={() => setView('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
              view === 'settings' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings size={20} />
            <span className="font-medium">Prompt Brain</span>
          </button>

          <div className="pt-6">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase mb-3">Labels</h3>
            <div className="space-y-2">
              {Object.entries(categoryColors).map(([name, colors]) => (
                <div key={name} className="flex items-center space-x-3 px-4 py-1">
                  <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
                  <span className="text-sm text-gray-700">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              disabled={processing}
              className="flex-1 px-3 py-2 bg-red-50 text-red-700 border-2 border-red-700 text-xs rounded hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Reset DB
            </button>
            <button
              onClick={handleSeed}
              disabled={processing}
              className="flex-1 px-3 py-2 bg-green-50 text-green-700 border-2 border-green-700 text-xs rounded hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Seed DB
            </button>
          </div>
          <button
            onClick={processInbox}
            disabled={processing}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {processing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                
                <span>Process Inbox</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {view === 'inbox' && filteredEmails.map((email) => {
            const isSelected = email.id === selectedEmailId;
            const colors = email.category ? categoryColors[email.category] : null;

            return (
              <div
                key={email.id}
                onClick={() => {
                  // Save current draft before switching
                  if (selectedEmailId && draftText) {
                    setEmailDrafts(prev => ({ ...prev, [selectedEmailId]: draftText }));
                  }
                  
                  // Switch to new email
                  setSelectedEmailId(email.id);
                  
                  // Load draft for new email if exists
                  setDraftText(emailDrafts[email.id] || '');
                  
                  // Clear chat history
                  setChatHistory([]);
                }}
                className={`p-4 border-b border-gray-200 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    {colors && (
                      <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : colors.dot}`}></div>
                    )}
                    <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {email.sender}
                    </span>
                  </div>
                  <span className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {email.timestamp}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <div className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {email.subject}
                  </div>
                  {email.category && colors && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${isSelected ? 'bg-white/20 text-white' : `${colors.bg} ${colors.text}`}`}>
                      {email.category}
                    </span>
                  )}
                </div>

                <div className={`text-sm line-clamp-2 ${isSelected ? 'text-indigo-100' : 'text-gray-600'}`}>
                  {email.body}
                </div>

                {email.actionItems && email.actionItems.length > 0 && (
                  <div className="flex items-center space-x-1 mt-2">
                    <CheckCircle size={14} className={isSelected ? 'text-white' : 'text-green-600'} />
                    <span className={`text-xs ${isSelected ? 'text-white' : 'text-green-600'}`}>
                      {email.actionItems.length} {email.actionItems.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          
          {view === 'drafts' && drafts.map((draft) => {
            const isSelected = draft.id === selectedDraftId;
            return (
              <div
                key={draft.id}
                onClick={() => setSelectedDraftId(draft.id)}
                className={`p-4 border-b border-gray-200 cursor-pointer transition-all ${
                  isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    To: {draft.to}
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {new Date(draft.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className={`font-medium text-sm mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {draft.subject}
                </div>
                <div className={`text-sm line-clamp-2 ${isSelected ? 'text-indigo-100' : 'text-gray-600'}`}>
                  {draft.body}
                </div>
                {draft.email && (
                  <div className={`text-xs mt-1 ${isSelected ? 'text-indigo-100' : 'text-indigo-600'}`}>
                    Re: {draft.email.subject}
                  </div>
                )}
              </div>
            );
          })}
          
          {view === 'drafts' && drafts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-3 text-gray-400" />
              <p>No drafts yet</p>
              <p className="text-sm mt-1">Generate drafts by clicking "Draft Reply" on emails</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white flex flex-col">
        {view === 'inbox' && selectedEmail ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                  {selectedEmail.sender.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-semibold text-gray-900">{selectedEmail.sender}</h2>
                    {selectedEmail.category && categoryColors[selectedEmail.category] && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[selectedEmail.category].bg} ${categoryColors[selectedEmail.category].text}`}>
                        {selectedEmail.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{selectedEmail.email}</span>
                    <span>•</span>
                    <span>{selectedEmail.timestamp}</span>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-4">{selectedEmail.subject}</h3>

              {selectedEmail.actionItems && selectedEmail.actionItems.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <CheckCircle size={18} className="text-orange-600" />
                    <span className="font-semibold text-orange-900">Action Items</span>
                  </div>
                  <div className="space-y-2">
                    {selectedEmail.actionItems.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <input type="checkbox" className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">{item.task}</span>
                            {item.priority === 'high' && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                HIGH
                              </span>
                            )}
                          </div>
                          {item.deadline && (
                            <div className="text-xs text-gray-600 mt-1">Due: {item.deadline}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {selectedEmail.body}
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50">
              <div className="px-6 py-3 border-b border-gray-200 flex space-x-2">
                <button
                  onClick={() => {
                    setChatMode('chat');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    chatMode === 'chat'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <MessageSquare size={16} />
                    <span>Chat with Agent</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setChatMode('draft');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    chatMode === 'draft'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <PenLine size={16} />
                    <span>Draft Reply</span>
                  </div>
                </button>
              </div>

              {chatMode === 'chat' && chatHistory.length > 0 && (
                <div className="px-6 py-4 max-h-64 overflow-y-auto space-y-3">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="px-6 py-4">
                {chatMode === 'draft' && (
                  <div className="mb-3">
                    <button
                      onClick={handleAutoDraft}
                      disabled={isGenerating}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Auto-Draft Reply</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="flex space-x-2">
                  {chatMode === 'chat' ? (
                    <>
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                        placeholder="Ask the AI agent about this email..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleChatSend}
                        disabled={!chatInput.trim() || isGenerating}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={18} />
                      </button>
                    </>
                  ) : (
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      placeholder="Your reply will appear here..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-32"
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : view === 'drafts' && selectedDraftId ? (
          <>
            {(() => {
              const selectedDraft = drafts.find(d => d.id === selectedDraftId);
              if (!selectedDraft) return null;

              return (
                <>
                  <div className="border-b border-gray-200 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Draft Preview</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Original Email Section */}
                    {selectedDraft.email && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                          Original Email
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold">
                              {selectedDraft.email.sender?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h2 className="text-lg font-semibold text-gray-900">{selectedDraft.email.sender}</h2>
                              </div>
                              <p className="text-sm text-gray-600">{selectedDraft.email.email}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-lg font-semibold text-gray-900 mb-2">{selectedDraft.email.subject}</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{selectedDraft.email.body}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Draft Reply Section */}
                    <div className="bg-white rounded-lg border-2 border-indigo-200">
                      <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-200">
                        <h4 className="text-sm font-semibold text-indigo-700 flex items-center">
                          <PenLine size={16} className="mr-2" />
                          Your Draft Reply
                        </h4>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">To</label>
                          <p className="text-gray-900">{selectedDraft.to}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase">Subject</label>
                          <p className="text-gray-900">{selectedDraft.subject}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Message</label>
                          <div className="bg-gray-50 rounded p-4 whitespace-pre-wrap text-gray-700">
                            {selectedDraft.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Inbox size={64} className="mx-auto mb-4" />
              <p>Select an email to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
