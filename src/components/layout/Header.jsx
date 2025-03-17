import { ArrowLeft, ArrowRight, Bell, Calendar, GraduationCap, History, Home, Info, LogOut, Moon, Sun, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../firebase/auth';
import { useDarkMode } from '../../hooks/useDarkMode';

const Header = ({ currentView = 'calendar', onViewChange }) => {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const { user, logout, userIsAdmin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Get first letter of display name or email for avatar
  const userInitial = user?.displayName ? user.displayName[0].toUpperCase() : 
                     user?.email ? user.email[0].toUpperCase() : 'U';
  
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-1.5 px-3 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <h1 className="text-xs font-bold text-mmu-blue dark:text-blue-400 mr-1.5">MMU</h1>
            <span className="text-xs font-medium dark:text-gray-300">LectureHub</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button className="p-0.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
              <ArrowLeft size={14} />
            </button>
            <button className="p-0.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
              <ArrowRight size={14} />
            </button>
            <button className="p-0.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
              <Info size={14} />
            </button>
          </div>
        </div>

        {!userIsAdmin && (
          <nav className="flex items-center space-x-5 absolute left-1/2 transform -translate-x-1/2">
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onViewChange('dashboard'); }}
              className={`flex flex-col items-center text-[10px] ${
                currentView === 'dashboard' 
                  ? 'font-medium border-b-2 border-mmu-blue dark:border-blue-400 text-mmu-blue dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Home className="h-3.5 w-3.5 mb-0.5" />
              <span>Home</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onViewChange('calendar'); }}
              className={`flex flex-col items-center text-[10px] ${
                currentView === 'calendar' 
                  ? 'font-medium border-b-2 border-mmu-blue dark:border-blue-400 text-mmu-blue dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 mb-0.5" />
              <span>Calendar</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onViewChange('courses'); }}
              className={`flex flex-col items-center text-[10px] ${
                currentView === 'courses' 
                  ? 'font-medium border-b-2 border-mmu-blue dark:border-blue-400 text-mmu-blue dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5 mb-0.5" />
              <span>Courses</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onViewChange('history'); }}
              className={`flex flex-col items-center text-[10px] ${
                currentView === 'history' 
                  ? 'font-medium border-b-2 border-mmu-blue dark:border-blue-400 text-mmu-blue dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <History className="h-3.5 w-3.5 mb-0.5" />
              <span>History</span>
            </a>
          </nav>
        )}

        <div className="flex items-center space-x-1.5">
          <button 
            onClick={toggleDarkMode}
            className="p-0.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          
          <button className="p-0.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
            <Bell size={14} />
          </button>
          
          {/* User profile with dropdown */}
          <div className="relative" ref={userMenuRef}>
            <div 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-6 h-6 bg-mmu-blue dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-medium cursor-pointer"
            >
              {userInitial}
            </div>
            
            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 text-xs border border-gray-200 dark:border-gray-700">
                {user && (
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium text-gray-700 dark:text-gray-300">
                      {user.displayName || user.email}
                    </p>
                    <div className="flex items-center">
                      <p className="text-gray-500 dark:text-gray-400 text-[10px]">
                        {user.role === USER_ROLES.ADMIN ? 'Administrator' : 'Lecturer'}
                      </p>
                      <span className={`ml-2 inline-flex text-[8px] leading-4 font-semibold rounded-full px-1.5 py-0.5 ${
                        user.role === USER_ROLES.ADMIN
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                )}
                
                {userIsAdmin && (
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      onViewChange('account');
                      setShowUserMenu(false);
                    }}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center">
                      <User size={12} className="mr-2" />
                      <span>Account Settings</span>
                    </div>
                  </a>
                )}
                
                {!userIsAdmin && (
                  <a 
                    href="#" 
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center">
                      <User size={12} className="mr-2" />
                      <span>My Profile</span>
                    </div>
                  </a>
                )}
                
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  className="block px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <LogOut size={12} className="mr-2" />
                    <span>Logout</span>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 