import { FileText, ArrowLeft, Mail } from 'lucide-react';
import Button from './common/Button';

// shows all saved drafts in a list
export default function DraftsView({ 
  drafts, 
  selectedDraftId, 
  onSelectDraft, 
  onBack,
  loading 
}) {
  const selectedDraft = drafts.find(d => d.id === selectedDraftId);
  
  return (
    <div className="flex-1 flex h-screen">
      <div className="w-96 border-r flex flex-col">
        <div className="p-4 border-b">
          <Button
            onClick={onBack}
            variant="ghost"
            icon={ArrowLeft}
          >
            Back to Inbox
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No drafts yet
            </div>
          ) : (
            drafts.map(draft => (
              <button
                key={draft.id}
                onClick={() => onSelectDraft(draft.id)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                  selectedDraftId === draft.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <FileText size={16} className="text-gray-500" />
                  <span className="font-semibold text-gray-900">
                    {draft.subject || 'Draft Reply'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {draft.body ? draft.body.substring(0, 100) : 'No content'}...
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {draft.createdAt
                    ? new Date(draft.createdAt).toLocaleString()
                    : 'Date unavailable'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedDraft ? (
          <div className="space-y-6">
          
            {selectedDraft.email && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  Original Message
                </h3>
                <div className="mb-3 pb-3 border-b border-gray-300">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">From:</span> {selectedDraft.email.sender}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Subject:</span> {selectedDraft.email.subject}
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {selectedDraft.email.body || 'No content available'}
                </p>
              </div>
            )}

          
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                Your Draft Reply
              </h3>
              <div className="mb-4 pb-4 border-b">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedDraft.subject || 'Draft Reply'}
                </h2>
                <div className="text-sm text-gray-600">
                  {selectedDraft.to && `To: ${selectedDraft.to}`}
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">
                  {selectedDraft.body || 'No content available'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Mail size={64} className="mx-auto mb-4 opacity-50" />
              <p>Select a draft to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
