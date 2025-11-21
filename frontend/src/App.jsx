import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { emailAPI, draftAPI, promptAPI, chatAPI, ingestAPI, resetAPI } from './utils/api';

import Sidebar from './components/Sidebar';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import DraftsView from './components/DraftsView';
import ChatInterface from './components/ChatInterface';
import PromptBrain from './components/PromptBrain';


function App() {
  // holding all our app state here
  const [emails, setEmails] = useState([]);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [view, setView] = useState('inbox');
  const [prompts, setPrompts] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMode, setChatMode] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [emailDrafts, setEmailDrafts] = useState({}); // Store draft text per email ID

  // fetches everything we need from backend when app loads
  const loadData = async () => {
    setLoading(true);
    try {
      const [emailsData, promptsData, draftsData] = await Promise.all([
        emailAPI.getAll(),
        promptAPI.getAll(),
        draftAPI.getAll()
      ]);
      
      setEmails(emailsData || []);
      setDrafts(draftsData || []);
      setPrompts(promptsData || []);
      
      if (emailsData && emailsData.length > 0) {
        setSelectedEmailId(emailsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Set default chat mode to 'chat' when email is selected
  useEffect(() => {
    if (selectedEmailId && !chatMode) {
      setChatMode('chat');
    }
  }, [selectedEmailId]);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  // Handlers
  const handleProcessInbox = async () => {
    setProcessing(true);
    try {
      await ingestAPI.processInbox();
      const updatedEmails = await emailAPI.getAll();
      setEmails(updatedEmails);
    } catch (error) {
      console.error('Failed to process inbox:', error);
    }
    setProcessing(false);
  };

  const handleReset = async () => {
    if (!confirm('Are you sure? This will delete ALL data from the database!')) return;
    
    setProcessing(true);
    try {
      await resetAPI.deleteAll();
      await loadData();
    } catch (error) {
      console.error('Reset failed:', error);
    }
    setProcessing(false);
  };

  const handleSeed = async () => {
    setProcessing(true);
    try {
      await resetAPI.seed();
      await loadData();
    } catch (error) {
      console.error('Seed failed:', error);
    }
    setProcessing(false);
  };

  const handleSelectEmail = (emailId) => {
    // saving current draft before switching to avoid losing work
    if (selectedEmailId && draftText) {
      setEmailDrafts(prev => ({ ...prev, [selectedEmailId]: draftText }));
    }
    
    // Switch to new email
    setSelectedEmailId(emailId);
    
    // Load draft for new email if exists
    setDraftText(emailDrafts[emailId] || '');
    
    // Clear chat
    setChatMode(null);
    setChatHistory([]);
  };

  const handleStartChat = () => {
    setChatMode('chat');
    setChatHistory([]);
  };

  const handleGenerateDraft = async () => {
    if (!selectedEmail) return;

    setIsGenerating(true);
    setChatMode('draft');
    
    try {
      const draft = await draftAPI.create(selectedEmail.id);
      setDraftText(draft.body);
      setEmailDrafts(prev => ({ ...prev, [selectedEmail.id]: draft.body }));
      
      // Reload drafts list
      const draftsData = await draftAPI.getAll();
      setDrafts(draftsData || []);
    } catch (error) {
      console.error('Draft generation failed:', error);
      setDraftText('Error: Unable to generate draft.');
    }
    
    setIsGenerating(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedEmail) return;

    const userMessage = { role: 'user', content: chatInput };
    setChatHistory(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsGenerating(true);

    try {
      const response = await chatAPI.sendMessage(selectedEmail.id, currentInput);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response.text }]);
    } catch (error) {
      console.error('Chat failed:', error);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: Unable to connect to backend.'
      }]);
    }

    setIsGenerating(false);
  };

  const handleSaveDraft = async () => {
    if (!selectedEmail || !draftText.trim()) return;
    
    setIsGenerating(true);
    try {
      await draftAPI.create(selectedEmail.id, draftText);
      setEmailDrafts(prev => ({ ...prev, [selectedEmail.id]: draftText }));
      
      // Reload drafts list
      const draftsData = await draftAPI.getAll();
      setDrafts(draftsData || []);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
    setIsGenerating(false);
  };

  const handleUpdatePrompt = async (promptId, newContent) => {
    try {
      // Find prompt name by ID
      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) return;
      
      await promptAPI.update(prompt.name, newContent);
      
      // Reload prompts
      const updatedPrompts = await promptAPI.getAll();
      setPrompts(updatedPrompts || []);
    } catch (error) {
      console.error('Failed to update prompt:', error);
      alert('Failed to update prompt');
    }
  };

  const handleBackFromChat = () => {
    // Save draft if in draft mode
    if (chatMode === 'draft' && selectedEmailId && draftText) {
      setEmailDrafts(prev => ({ ...prev, [selectedEmailId]: draftText }));
    }
    
    setChatMode(null);
    setChatHistory([]);
  };

  const handleBackFromDrafts = () => {
    setView('inbox');
    setSelectedDraftId(null);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render main application
  return (
    <div className="h-screen bg-gray-50 flex">
      <Sidebar
        activeView={view}
        onViewChange={setView}
        onProcessInbox={handleProcessInbox}
        onReset={handleReset}
        onSeed={handleSeed}
        processing={processing}
        loading={loading}
      />

      {view === 'inbox' ? (
        <>
          <EmailList
            emails={emails}
            selectedEmailId={selectedEmailId}
            onSelectEmail={handleSelectEmail}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            loading={loading}
          />
          <div className="flex-1 flex flex-col h-screen">
            <EmailDetail
              email={selectedEmail}
              onStartChat={handleStartChat}
              onGenerateDraft={handleGenerateDraft}
              isGenerating={isGenerating}
              showActions={false}
            />
            <ChatInterface
              email={selectedEmail}
              mode={chatMode}
              chatHistory={chatHistory}
              chatInput={chatInput}
              draftText={draftText}
              isGenerating={isGenerating}
              onChatInputChange={setChatInput}
              onSendMessage={handleSendMessage}
              onDraftTextChange={setDraftText}
              onSaveDraft={handleSaveDraft}
              onGenerateDraft={handleGenerateDraft}
              onModeChange={setChatMode}
            />
          </div>
        </>
      ) : view === 'drafts' ? (
        <DraftsView
          drafts={drafts}
          selectedDraftId={selectedDraftId}
          onSelectDraft={setSelectedDraftId}
          onBack={handleBackFromDrafts}
          loading={loading}
        />
      ) : view === 'prompt-brain' ? (
        <PromptBrain
          prompts={prompts}
          onUpdatePrompt={handleUpdatePrompt}
          loading={loading}
        />
      ) : null}
    </div>
  );
}

export default App;
