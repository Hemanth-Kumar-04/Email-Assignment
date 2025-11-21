import { Send, FileText, MessageSquare, Sparkles } from 'lucide-react';
import Button from './common/Button';

// handles both chat and draft editing modes
export default function ChatInterface({ 
  email,
  mode,
  chatHistory, 
  chatInput, 
  draftText,
  isGenerating,
  onChatInputChange, 
  onSendMessage,
  onDraftTextChange,
  onSaveDraft,
  onGenerateDraft,
  onModeChange
}) {
  if (!email) return null;
  
  return (
    <div className="border-t bg-gray-50">
      <div className="px-6 py-3 border-b bg-white flex space-x-2">
        <button
          onClick={() => onModeChange('chat')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            mode === 'chat'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center space-x-2">
            <MessageSquare size={16} />
            <span>Chat with Agent</span>
          </div>
        </button>
        <button
          onClick={() => onModeChange('draft')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            mode === 'draft'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileText size={16} />
            <span>Draft Reply</span>
          </div>
        </button>
      </div>

      {mode === 'chat' ? (
        <>
          {chatHistory.length > 0 && (
            <div className="px-6 py-4 max-h-64 overflow-y-auto space-y-3 bg-white">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      <span className="text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="px-6 py-4 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => onChatInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isGenerating && onSendMessage()}
                placeholder="Ask the AI agent about this email..."
                disabled={isGenerating}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50"
              />
              <Button
                onClick={onSendMessage}
                disabled={!chatInput.trim() || isGenerating}
                loading={isGenerating}
                icon={Send}
              >
                Send
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="px-6 py-4 bg-white">
            {!draftText && (
              <div className="mb-3">
                <Button
                  onClick={onGenerateDraft}
                  disabled={isGenerating}
                  loading={isGenerating}
              
                  variant="primary"
                >
                  Auto-Draft Reply
                </Button>
              </div>
            )}
            
            <textarea
              value={draftText}
              onChange={(e) => onDraftTextChange(e.target.value)}
              placeholder="Your reply will appear here..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none h-32"
            />
          </div>
          
          {draftText && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <Button
                onClick={onSaveDraft}
                disabled={!draftText.trim() || isGenerating}
                loading={isGenerating}
                variant="primary"
              >
                Save Draft
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
