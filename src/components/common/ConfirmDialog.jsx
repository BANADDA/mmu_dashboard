import { AlertCircle } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info' // info, warning, danger
}) => {
  if (!isOpen) return null;
  
  // Get the appropriate styling based on the type
  const getHeaderStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/30 border-b-2 border-red-500';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/30 border-b-2 border-amber-500';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/30 border-b-2 border-blue-500';
    }
  };
  
  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };
  
  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-fade-in-up transform transition-all">
        <div className={`px-6 py-4 ${getHeaderStyles()} rounded-t-lg flex items-center`}>
          <AlertCircle className={`h-5 w-5 ${getIconColor()} mr-2`} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
        </div>
        
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`inline-flex justify-center px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 