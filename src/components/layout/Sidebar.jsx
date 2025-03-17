import { addDays, eachDayOfInterval, endOfMonth, format, isSameDay, isToday, startOfMonth } from 'date-fns';
import { collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Clock, GraduationCap, Plus } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CalendarContext } from '../../context/CalendarContext';
import { db } from '../../firebase/config';

const Sidebar = ({ onScheduleClick, tabs, activeTab, onTabChange, isOpen }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { user } = useAuth();
  
  // Safely check if CalendarContext is available before using it
  const calendarContext = useContext(CalendarContext);
  const hasCalendarContext = !!calendarContext;
  
  // Only destructure the calendar context if it exists
  const { selectedDate, setSelectedDate } = hasCalendarContext 
    ? calendarContext 
    : { selectedDate: new Date(), setSelectedDate: () => {} };
  
  const [upcomingLectures, setUpcomingLectures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [monthLectures, setMonthLectures] = useState([]);
  
  // Fetch lecturer's schedules with real-time updates
  useEffect(() => {
    if (!hasCalendarContext || !user?.uid) return; // Skip for admin dashboard or if no user
    
    setLoading(true);
    console.log('Setting up real-time schedule listener for sidebar...');
    
    // Get current date at the start of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get date 30 days from now to limit the query and cover both upcoming and month view
    const thirtyDaysLater = addDays(today, 30);
    
    // Create query for schedules assigned to this lecturer
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('lecturerId', '==', user.uid),
      where('date', '>=', Timestamp.fromDate(today)),
      where('date', '<=', Timestamp.fromDate(thirtyDaysLater)),
      orderBy('date', 'asc')
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(
      schedulesQuery,
      (snapshot) => {
        try {
          const schedules = [];
          
          snapshot.docs.forEach(doc => {
            const schedule = {
              id: doc.id,
              ...doc.data()
            };
            
            // Convert Firebase timestamp to JS Date
            if (schedule.date && typeof schedule.date.toDate === 'function') {
              schedule.date = schedule.date.toDate();
            } else if (schedule.date) {
              schedule.date = new Date(schedule.date);
            }
            
            // Only include the schedule if it has a valid date
            if (schedule.date && !isNaN(schedule.date.getTime())) {
              schedules.push(schedule);
            }
          });
          
          // Process schedules for different views
          processSchedules(schedules);
          setLoading(false);
        } catch (error) {
          console.error('Error processing sidebar schedules:', error);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching sidebar schedules:', error);
        setLoading(false);
      }
    );
    
    // Clean up listener on unmount
    return () => {
      console.log('Cleaning up sidebar schedule listener');
      unsubscribe();
    };
  }, [hasCalendarContext, user]);
  
  // Process schedules for different views when either schedules or selected month changes
  const processSchedules = (schedules) => {
    // Process schedules for month view (to highlight days)
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    const schedulesInMonth = schedules.filter(schedule => 
      schedule.date >= monthStart && schedule.date <= monthEnd
    );
    
    setMonthLectures(schedulesInMonth);
    
    // Process schedules for upcoming lectures view
    const formattedSchedules = schedules.map(schedule => {
      // Format date and time for display
      let dateLabel = 'Unknown date';
      
      if (schedule.date) {
        if (isToday(schedule.date)) {
          dateLabel = 'Today';
        } else if (isToday(addDays(schedule.date, -1))) {
          dateLabel = 'Tomorrow';
        } else {
          dateLabel = format(schedule.date, 'EEE, MMM d');
        }
      }
      
      // Format time
      const startTime = schedule.startTime || '00:00';
      const endTime = schedule.endTime || '00:00';
      const timeLabel = `${dateLabel}, ${startTime} - ${endTime}`;
      
      // Determine color based on lecture type
      let color = 'bg-blue-500';
      switch (schedule.type) {
        case 'lab':
          color = 'bg-green-500';
          break;
        case 'tutorial':
          color = 'bg-purple-500';
          break;
        case 'workshop':
          color = 'bg-orange-500';
          break;
        default:
          color = 'bg-blue-500';
      }
      
      return {
        id: schedule.id,
        title: schedule.title || 'Untitled Lecture',
        time: timeLabel,
        room: schedule.room || 'Room not specified',
        color: color,
        date: schedule.date
      };
    });
    
    // Sort by date and limit to 5
    formattedSchedules.sort((a, b) => a.date - b.date);
    setUpcomingLectures(formattedSchedules.slice(0, 5));
  };
  
  // Reprocess schedules when month changes
  useEffect(() => {
    if (monthLectures.length > 0) {
      processSchedules(monthLectures);
    }
  }, [selectedMonth]);

  // Handlers for calendar navigation
  const prevMonth = () => {
    const prevMonthDate = new Date(selectedMonth);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    setSelectedMonth(prevMonthDate);
  };

  const nextMonth = () => {
    const nextMonthDate = new Date(selectedMonth);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    setSelectedMonth(nextMonthDate);
  };

  // Get all days in the selected month for the calendar
  const getDaysInMonth = () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    return eachDayOfInterval({ start, end });
  };

  const days = getDaysInMonth();
  
  // Check if a day has scheduled lectures
  const hasScheduledLecture = (day) => {
    return monthLectures.some(lecture => 
      lecture.date && isSameDay(lecture.date, day)
    );
  };

  // Handle date selection in the calendar
  const handleDateClick = (date) => {
    if (hasCalendarContext && setSelectedDate) {
      setSelectedDate(date);
    }
  };

  // Render admin sidebar with tabs if tabs are provided
  if (tabs && onTabChange) {
    return (
      <aside 
        className={`fixed inset-y-0 left-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 mt-16 pt-6 transition-all duration-200 transform z-30 ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 md:translate-x-0 md:w-0'
        }`}
      >
        <div className="px-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white pb-4">
            Admin Dashboard
          </h2>
          
          <nav className="mt-2">
            <ul className="space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center w-full px-4 py-2.5 text-left rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    );
  }

  // Render lecturer sidebar with calendar (default)
  return (
    <aside className="hidden md:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4">
        {/* Mini Calendar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(selectedMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex space-x-2">
              <button 
                onClick={prevMonth}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                onClick={nextMonth}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const isSelected = hasCalendarContext && selectedDate ? isSameDay(day, selectedDate) : false;
              const hasLecture = hasScheduledLecture(day);
              const dayClass = `
                h-8 w-8 flex items-center justify-center rounded-full text-sm 
                ${isToday(day) ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'} 
                ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : hasLecture ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
              `;
              return (
                <button
                  key={day.toString()}
                  className={dayClass}
                  onClick={() => handleDateClick(day)}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Schedule Button */}
        {onScheduleClick && (
          <button 
            onClick={onScheduleClick}
            className="w-full flex items-center justify-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule Lecture
          </button>
        )}

        {/* Upcoming Lectures */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Upcoming Lectures
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 dark:border-blue-400"></div>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading...</span>
              </div>
            ) : (
              upcomingLectures.map(lecture => (
                <div 
                  key={lecture.id}
                  className="bg-white dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-md p-3 shadow-sm"
                >
                  <div className={`w-2 h-2 rounded-full ${lecture.color} mb-2`}></div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {lecture.title}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {lecture.time}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <GraduationCap className="w-3 h-3 mr-1" />
                    {lecture.room}
                  </div>
                </div>
              ))
            )}
            {!loading && upcomingLectures.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                No upcoming lectures scheduled.
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 