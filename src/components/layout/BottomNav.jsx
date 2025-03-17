import { Calendar, GraduationCap, History, Home } from 'lucide-react';

const BottomNav = ({ currentView = 'calendar', onViewChange }) => {
  return (
    <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 fixed bottom-0 left-0 right-0 z-50 transition-colors duration-200">
      <div className="grid grid-cols-4 h-14">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onViewChange('dashboard'); }}
          className={`flex flex-col items-center justify-center ${
            currentView === 'dashboard'
              ? 'text-mmu-blue dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-mmu-blue dark:hover:text-blue-400'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </a>
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onViewChange('calendar'); }}
          className={`flex flex-col items-center justify-center ${
            currentView === 'calendar'
              ? 'text-mmu-blue dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-mmu-blue dark:hover:text-blue-400'
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Calendar</span>
        </a>
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onViewChange('courses'); }}
          className={`flex flex-col items-center justify-center ${
            currentView === 'courses'
              ? 'text-mmu-blue dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-mmu-blue dark:hover:text-blue-400'
          }`}
        >
          <GraduationCap className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Courses</span>
        </a>
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onViewChange('history'); }}
          className={`flex flex-col items-center justify-center ${
            currentView === 'history'
              ? 'text-mmu-blue dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-mmu-blue dark:hover:text-blue-400'
          }`}
        >
          <History className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">History</span>
        </a>
      </div>
    </div>
  );
};

export default BottomNav; 