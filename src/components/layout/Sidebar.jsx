import { eachDayOfInterval, endOfMonth, format, isSameDay, isToday, startOfMonth } from 'date-fns';
import { Book, Calendar, ChevronLeft, ChevronRight, Clock, GraduationCap, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';

const Sidebar = ({ onScheduleClick }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { selectedDate, setSelectedDate } = useCalendar();
  const [upcomingLectures, setUpcomingLectures] = useState([]);
  
  // Sample upcoming lectures
  useEffect(() => {
    const sampleLectures = [
      {
        id: 1,
        title: 'Software Engineering Lecture',
        time: 'Today, 09:00 - 11:00 AM',
        room: 'Block A - Room 101',
        color: 'bg-blue-500'
      },
      {
        id: 2,
        title: 'Database Systems Lab',
        time: 'Tomorrow, 02:00 - 04:00 PM',
        room: 'Block B - Lab 203',
        color: 'bg-green-500'
      },
      {
        id: 3,
        title: 'Web Development',
        time: 'Wed, 03:00 - 05:00 PM',
        room: 'Block A - Room 105',
        color: 'bg-purple-500'
      }
    ];
    
    setUpcomingLectures(sampleLectures);
  }, []);
  
  const prevMonth = () => {
    const date = new Date(selectedMonth);
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(date);
  };
  
  const nextMonth = () => {
    const date = new Date(selectedMonth);
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(date);
  };
  
  // Generate calendar grid data for mini calendar
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week for the first day (0 = Sunday)
  const firstDayOfMonth = monthStart.getDay();
  
  // Create array for calendar grid including empty cells for previous month
  const calendarGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarGrid.push(null);
  }
  calendarGrid.push(...daysInMonth);

  const handleDateClick = (date) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  // Sample courses data
  const courses = [
    {
      id: 1,
      name: 'Software Engineering',
      color: 'bg-blue-500 dark:bg-blue-600'
    },
    {
      id: 2,
      name: 'Database Systems',
      color: 'bg-green-500 dark:bg-green-600'
    },
    {
      id: 3,
      name: 'Web Development',
      color: 'bg-purple-500 dark:bg-purple-600'
    },
    {
      id: 4,
      name: 'Mobile App Development',
      color: 'bg-amber-500 dark:bg-amber-600'
    },
    {
      id: 5,
      name: 'Computer Networks',
      color: 'bg-teal-500 dark:bg-teal-600'
    }
  ];
  
  return (
    <div className="w-60 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full transition-colors duration-200">
      {/* Fixed top section - Calendar */}
      <div className="flex-shrink-0">
        {/* Schedule Lecture Button */}
        <div className="p-3">
          <button 
            onClick={onScheduleClick}
            className="flex items-center justify-center w-full gap-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-1.5 px-3 text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Lecture</span>
          </button>
        </div>
        
        {/* Mini Calendar */}
        <div className="px-3 mb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
                <ChevronLeft className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              </button>
              <span className="text-xs font-medium mx-2 dark:text-gray-300">
                {format(selectedMonth, 'MMMM yyyy')}
              </span>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
                <ChevronRight className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarGrid.map((date, i) => (
                <div
                  key={i}
                  onClick={() => handleDateClick(date)}
                  className={`
                    h-6 w-6 flex items-center justify-center text-xs rounded-full transition-colors cursor-pointer
                    ${!date ? 'text-gray-300 dark:text-gray-700' : 'text-gray-600 dark:text-gray-300'}
                    ${date && isSameDay(date, selectedDate) ? 'bg-blue-500 text-white' : ''}
                    ${date && isToday(date) && !isSameDay(date, selectedDate) ? 'border border-blue-500' : ''}
                    ${date && !isSameDay(date, selectedDate) ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                  `}
                >
                  {date ? date.getDate() : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-800 my-2 mx-3"></div>
      </div>
      
      {/* Scrollable section - Courses and Lectures */}
      <div className="flex-1 overflow-y-auto px-3 pt-1 pb-3">
        {/* My Courses section */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-xs mb-2">
            <GraduationCap className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 mr-1.5" />
            <span className="text-gray-500 dark:text-gray-400 font-medium">My Courses</span>
          </div>
          
          <div className="space-y-2">
            {courses.map(course => (
              <div key={course.id} className="flex items-center py-1 px-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className={`w-3 h-3 ${course.color} rounded-sm mr-2`}></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">{course.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Upcoming Lectures section */}
        <div className="space-y-3">
          <div className="flex items-center text-xs mb-2">
            <Calendar className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 mr-1.5" />
            <span className="text-gray-500 dark:text-gray-400 font-medium">Upcoming Lectures</span>
          </div>
          
          <div className="space-y-2">
            {upcomingLectures.map(lecture => (
              <div key={lecture.id} className="p-2 rounded-md border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                <div className="flex items-center mb-1">
                  <div className={`w-2 h-2 ${lecture.color} rounded-full mr-1.5`}></div>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{lecture.title}</span>
                </div>
                <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{lecture.time}</span>
                </div>
                <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400">
                  <Book className="h-3 w-3 mr-1" />
                  <span>{lecture.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Adding more lectures for demonstrating scroll */}
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map(item => (
            <div key={`extra-${item}`} className="p-2 rounded-md border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
              <div className="flex items-center mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></div>
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Extra Lecture {item}</span>
              </div>
              <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="h-3 w-3 mr-1" />
                <span>Next Week, TBA</span>
              </div>
              <div className="flex items-center text-[10px] text-gray-500 dark:text-gray-400">
                <Book className="h-3 w-3 mr-1" />
                <span>Location TBD</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 