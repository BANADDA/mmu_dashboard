import React, { createContext, useContext, useRef, useState } from 'react';
import Toast from './Toast';

// Create context
const ToastContext = createContext({
  addToast: () => {},
  removeToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {}
});

// Custom hook to use the toast context
export const useToast = () => useContext(ToastContext);

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const MAX_TOASTS = 3; // Maximum number of toasts to show at once
  const recentToastsRef = useRef({}); // Track recent toast messages to prevent duplicates
  
  // Function to add a toast with duplicate prevention
  const addToast = (message, type = 'success', duration = 5000) => {
    // Check if this exact message+type combination was shown recently
    const messageKey = `${type}:${message}`;
    const now = Date.now();
    
    // If we've shown this message in the last 3 seconds, don't show it again
    if (recentToastsRef.current[messageKey] && 
        now - recentToastsRef.current[messageKey] < 3000) {
      console.log('Preventing duplicate toast:', message);
      return null;
    }
    
    // Record this message as recently shown
    recentToastsRef.current[messageKey] = now;
    
    // Generate a unique ID for this toast
    const id = now.toString();
    
    // Add the new toast while respecting the maximum limit
    setToasts(prev => {
      // If we're at the maximum, remove the oldest toast
      if (prev.length >= MAX_TOASTS) {
        return [...prev.slice(1), { id, message, type, duration }];
      }
      return [...prev, { id, message, type, duration }];
    });
    
    // Clean up old entries from recentToastsRef every 10 seconds
    setTimeout(() => {
      const currentTime = Date.now();
      Object.keys(recentToastsRef.current).forEach(key => {
        if (currentTime - recentToastsRef.current[key] > 10000) {
          delete recentToastsRef.current[key];
        }
      });
    }, 10000);
    
    return id;
  };

  // Function to remove a toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Helper functions for different toast types
  const showSuccess = (message, duration) => {
    return addToast(message, 'success', duration);
  };

  const showError = (message, duration) => {
    return addToast(message, 'error', duration || 6000); // Errors stay longer by default
  };

  const showInfo = (message, duration) => {
    return addToast(message, 'info', duration);
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showInfo }}>
      {children}
      
      {/* Render the toast container */}
      <div className="toast-container">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="toast-wrapper"
            style={{ 
              bottom: `${(index * 60) + 16}px`, 
              position: 'fixed',
              right: '16px',
              zIndex: 9999,
              transition: 'all 0.3s ease-in-out'
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
              show={true}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider; 