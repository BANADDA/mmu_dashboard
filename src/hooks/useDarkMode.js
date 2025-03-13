import { useEffect, useState } from 'react';

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if dark mode preference exists in localStorage
    const savedMode = localStorage.getItem('darkMode');
    // Check system preference if no saved preference
    if (savedMode === null) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return savedMode === 'true';
  });

  useEffect(() => {
    // Update document class and localStorage when dark mode changes
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  return [isDarkMode, setIsDarkMode];
}; 