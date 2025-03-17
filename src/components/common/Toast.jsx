import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const Toast = ({ 
  message, 
  type = 'success', 
  duration = 5000,
  onClose,
  show = true
}) => {
  const [visible, setVisible] = useState(show);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    setVisible(show);
    
    if (show && duration !== null) {
      setProgress(100);
      
      const startTime = Date.now();
      const endTime = startTime + duration;
      
      const progressInterval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        const newProgress = (remaining / duration) * 100;
        setProgress(newProgress);
        
        if (now >= endTime) {
          clearInterval(progressInterval);
        }
      }, 50);
      
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          if (onClose) onClose();
        }, 400);
      }, duration);
      
      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
      };
    }
  }, [show, duration, onClose]);
  
  if (!visible && !show) return null;
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-white" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-white" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-white" />;
    }
  };
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };
  
  const getTextColor = () => {
    return 'text-white';
  };
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 400);
  };
  
  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-center p-3 rounded-md shadow-xl ${getBackgroundColor()} ${getTextColor()} 
                 ${visible ? 'animate-fade-in opacity-100 translate-y-0' : 'animate-fade-out opacity-0 translate-y-2'} 
                 transition-all duration-400 ease-in-out overflow-hidden max-w-md`}
      role="alert"
    >
      <div className="mr-2">
        {getIcon()}
      </div>
      <div className="mr-8 text-sm font-medium">{message}</div>
      <button 
        onClick={handleClose}
        className="absolute top-1 right-1 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
        aria-label="Close"
      >
        <X className="h-3 w-3 text-white" />
      </button>
      
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 transition-all duration-200 ease-linear"
             style={{ width: `${progress}%`, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}>
        </div>
      )}
    </div>
  );
};

export default Toast; 