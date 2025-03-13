import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {children}
      <div className="h-14 md:hidden"></div> {/* Spacer for mobile bottom navigation */}
    </div>
  );
};

export default Layout; 