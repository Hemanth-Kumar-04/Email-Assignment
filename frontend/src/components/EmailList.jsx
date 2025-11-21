import { Mail, Search } from 'lucide-react';
import CategoryBadge from './common/CategoryBadge';

// shows list of emails with search functionality
export default function EmailList({ 
  emails, 
  selectedEmailId, 
  onSelectEmail, 
  searchQuery, 
  onSearchChange,
  loading 
}) {
  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.body.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="w-96 border-r flex flex-col h-screen">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No emails found' : 'No emails'}
          </div>
        ) : (
          filteredEmails.map(email => (
            <button
              key={email.id}
              onClick={() => onSelectEmail(email.id)}
              className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                selectedEmailId === email.id ? 'bg-gray-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="font-semibold text-gray-900 truncate flex-1">
                  {email.sender}
                </div>
                {email.category && (
                  <CategoryBadge category={email.category} />
                )}
              </div>
              <div className="text-sm text-gray-600 truncate mb-1">
                {email.subject}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {email.body.substring(0, 60)}...
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
