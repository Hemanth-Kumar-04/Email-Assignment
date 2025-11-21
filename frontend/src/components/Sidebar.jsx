import { Inbox, FileText, Brain, Trash2, Database, RefreshCw } from 'lucide-react';
import Button from './common/Button';
import { categoryColors } from '../utils/constants';

export default function Sidebar({ 
  activeView, 
  onViewChange, 
  onProcessInbox, 
  onReset,
  onSeed, 
  processing, 
  loading 
}) {
  const navItems = [
    { id: 'inbox', icon: Inbox, label: 'Inbox' },
    { id: 'drafts', icon: FileText, label: 'Drafts' },
    { id: 'prompt-brain', icon: Brain, label: 'Prompt Brain' }
  ];
  
  return (
    <div className="w-64 border-r p-4 flex flex-col h-screen">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Email Assistant</h2>
      
      <nav className="space-y-2 flex-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === item.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
        
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
      
      <div className="space-y-2 pt-4 border-t">
        <Button
          onClick={onProcessInbox}
          disabled={processing || loading}
          loading={processing}
          variant="primary"
          size="md"
          icon={Inbox}
          className="w-full"
        >
          Process Inbox
        </Button>
        
        <Button
          onClick={onReset}
          disabled={processing || loading}
          variant="danger"
          size="md"
          className="w-full"
        >
          Reset DB
        </Button>
        
        <Button
          onClick={onSeed}
          disabled={processing || loading}
          variant="success"
          size="md"
          className="w-full"
        >
          Seed DB
        </Button>
      </div>
    </div>
  );
}
