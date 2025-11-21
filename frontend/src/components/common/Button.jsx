import { Loader2, Sparkles } from 'lucide-react';

export default function Button({ 
  onClick, 
  disabled, 
  loading, 
  variant = 'primary', 
  size = 'md', 
  children,
  icon: Icon,
  className = ''
}) {
  const baseClasses = 'flex items-center justify-center space-x-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium';
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    danger: 'bg-red-50 text-red-700 border-2 border-red-700 hover:bg-red-100',
    success: 'bg-green-50 text-green-700 border-2 border-green-700 hover:bg-green-100',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    ghost: 'text-gray-600 hover:bg-gray-100'
  };
  
  const sizes = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 size={size === 'lg' ? 20 : 16} className="animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={size === 'lg' ? 20 : 16} />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
