import { useState } from 'react';
import { Brain, Edit2, Save, X } from 'lucide-react';
import Button from './common/Button';

// lets users edit AI prompt templates
export default function PromptBrain({ prompts, onUpdatePrompt, loading }) {
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  
  const handleStartEdit = (prompt) => {
    setEditingPrompt(prompt);
    setEditedContent(prompt.content);
  };
  
  const handleSaveEdit = async () => {
    if (editedContent.trim() && editingPrompt) {
      await onUpdatePrompt(editingPrompt.id, editedContent);
      setEditingPrompt(null);
      setEditedContent('');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingPrompt(null);
    setEditedContent('');
  };
  
  return (
    <div className="flex-1 p-8 overflow-y-auto h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Brain size={32} className="text-gray-900" />
          <h1 className="text-3xl font-bold text-gray-900">Prompt Brain</h1>
        </div>
        
        <p className="text-gray-600 mb-8">
          Customize the AI prompts used for email categorization and draft generation.
        </p>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {prompts.map(prompt => (
              <div key={prompt.id} className="bg-white border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {prompt.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {prompt.description}
                    </p>
                  </div>
                  
                  {editingPrompt?.id === prompt.id ? (
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSaveEdit}
                        variant="success"
                        size="sm"
                        icon={Save}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="ghost"
                        size="sm"
                        icon={X}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleStartEdit(prompt)}
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                    >
                      Edit
                    </Button>
                  )}
                </div>
                
                {editingPrompt?.id === prompt.id ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-48 p-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {prompt.content}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
