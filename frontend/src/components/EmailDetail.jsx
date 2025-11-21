import { Mail, MessageSquare, FileText, CheckCircle } from 'lucide-react';
import CategoryBadge from './common/CategoryBadge';
import Button from './common/Button';

export default function EmailDetail({ 
  email, 
  onStartChat, 
  onGenerateDraft,
  isGenerating,
  showActions = true
}) {
  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Mail size={64} className="mx-auto mb-4 opacity-50" />
          <p>Select an email to view details</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="border-b p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {email.subject}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="font-medium">{email.sender}</span>
              <span>•</span>
              <span>{new Date(email.timestamp).toLocaleString()}</span>
            </div>
          </div>
          {email.category && (
            <CategoryBadge category={email.category} />
          )}
        </div>
      </div>
      
      <div className="p-6">
        {email.actionItems && email.actionItems.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle size={18} className="text-orange-600" />
              <span className="font-semibold text-orange-900">Action Items</span>
            </div>
            <div className="space-y-2">
              {email.actionItems.map((item, idx) => (
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
        
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap text-gray-700">
            {email.body}
          </p>
        </div>
      </div>
    </div>
  );
}
