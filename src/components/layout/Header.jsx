import { ArrowLeft, ArrowRight, Bell, Calendar, GraduationCap, History, Home, Info, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

const Header = ({ currentView = 'calendar', onViewChange }) => {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };
  
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
          <a href="#" className="flex flex-col items-center text-[10px] text-gray-600 dark:text-gray-400">
            <History className="h-3.5 w-3.5 mb-0.5" />
            <span>History</span>
          </a>
        </nav>

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
          
          <div className="w-6 h-6 bg-mmu-blue dark:bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-medium cursor-pointer">
            L
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 