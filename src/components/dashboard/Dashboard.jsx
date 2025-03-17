import { differenceInHours, endOfMonth, format, isSameDay, startOfMonth } from 'date-fns';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { Calendar as CalendarIcon, Clock, GraduationCap, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { useToast } from '../common/ToastManager';
import BottomNav from '../layout/BottomNav';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';

const Dashboard = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLectureHours: 0,
    totalLectures: 0,
    averageAttendance: 85, // Default value until we have real attendance data
    courseCompletion: 0,
    weeklyData: [0, 0, 0, 0, 0, 0, 0], // Hours per day of week (Sun-Sat)
    upcomingLectures: []
  });

  // Debug information
  useEffect(() => {
    console.log("Dashboard component mounted");
    console.log("Current user:", user);
    console.log("Firebase database reference:", db);
  }, [user]);

  // Fetch dashboard data when component mounts
  useEffect(() => {
    console.log("Starting data fetch. User:", user?.uid);
    
    if (!user?.uid) {
      console.warn("No user ID available, can't fetch data");
      return;
    }
    
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        console.log("Fetching schedules for user:", user.uid);
        
        // Fetch all schedules for this lecturer
        const schedulesQuery = query(
          collection(db, 'schedules'),
          where('lecturerId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        console.log("Firebase query created:", schedulesQuery);
        
        const schedulesSnapshot = await getDocs(schedulesQuery);
        console.log("Query results received. Document count:", schedulesSnapshot.docs.length);
        
        const schedules = schedulesSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log("Processing document:", doc.id, data);
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate() || new Date(),
          };
        });
        
        console.log("Processed schedules:", schedules.length);
        
        if (schedules.length === 0) {
          console.log("No schedules found for user");
          showSuccess("Dashboard ready - no lectures found");
          setLoading(false);
          return; // No schedules found
        }
        
        // Calculate total lecture hours
        let totalHours = 0;
        schedules.forEach(schedule => {
          const startTime = schedule.startTime?.split(':') || ['09', '00'];
          const endTime = schedule.endTime?.split(':') || ['11', '00'];
          
          const startDate = new Date(schedule.date);
          startDate.setHours(parseInt(startTime[0], 10), parseInt(startTime[1], 10));
          
          const endDate = new Date(schedule.date);
          endDate.setHours(parseInt(endTime[0], 10), parseInt(endTime[1], 10));
          
          const hours = differenceInHours(endDate, startDate) || 2; // Default to 2 hours if calculation fails
          totalHours += hours;
        });
        
        console.log("Total lecture hours calculated:", totalHours);
        
        // Get current month's schedules to calculate course completion percentage
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        
        const thisMonthSchedules = schedules.filter(
          schedule => schedule.date >= monthStart && schedule.date <= monthEnd
        );
        
        console.log("This month's schedules:", thisMonthSchedules.length);
        
        const courseCompletion = Math.min(
          Math.floor((thisMonthSchedules.length / Math.max(schedules.length * 0.25, 1)) * 100), 
          100
        );
        
        // Get upcoming lectures (future dates)
        const upcomingLectures = schedules
          .filter(schedule => schedule.date >= now)
          .sort((a, b) => a.date - b.date)
          .slice(0, 3)
          .map(schedule => {
            // Create formatted data for display
            const startTime = schedule.startTime || '09:00';
            const endTime = schedule.endTime || '11:00';
            const dateObj = new Date(schedule.date);
            
            return {
              id: schedule.id,
              title: schedule.title || 'Untitled Lecture',
              isToday: isSameDay(dateObj, now),
              isTomorrow: isSameDay(dateObj, new Date(now.getTime() + 86400000)),
              dateFormatted: format(dateObj, 'EEE, MMM d'),
              timeFormatted: `${startTime} - ${endTime}`,
              location: schedule.room || 'Not specified',
              type: schedule.type || 'lecture',
              attendance: Math.floor(Math.random() * 20) + 75 // Placeholder attendance data
            };
          });
          
        console.log("Upcoming lectures:", upcomingLectures.length);
          
        // Calculate weekly time distribution (hours per day of week)
        const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
        
        schedules.forEach(schedule => {
          const date = new Date(schedule.date);
          const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
          
          const startTime = schedule.startTime?.split(':') || ['09', '00'];
          const endTime = schedule.endTime?.split(':') || ['11', '00'];
          
          const startDate = new Date(schedule.date);
          startDate.setHours(parseInt(startTime[0], 10), parseInt(startTime[1], 10));
          
          const endDate = new Date(schedule.date);
          endDate.setHours(parseInt(endTime[0], 10), parseInt(endTime[1], 10));
          
          const hours = differenceInHours(endDate, startDate) || 2;
          weeklyData[dayOfWeek] += hours;
        });
        
        console.log("Weekly data calculated:", weeklyData);
        
        // Set stats data
        const newStats = {
          totalLectureHours: totalHours,
          totalLectures: schedules.length,
          averageAttendance: Math.floor(Math.random() * 15) + 80, // Placeholder until we have real attendance data
          courseCompletion,
          weeklyData,
          upcomingLectures
        };
        
        console.log("Setting new stats:", newStats);
        setStats(newStats);
        showSuccess("Dashboard data updated successfully");
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError('Failed to load dashboard data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Set up a refresh interval
    const refreshInterval = setInterval(() => {
      console.log("Refreshing dashboard data...");
      fetchDashboardData();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, [user, showError, showSuccess]);
  
  // Helper function to determine color for lecture type
  const getLectureTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'lecture':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
      case 'lab':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'tutorial':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'workshop':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
      default:
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
    }
  };
  
  // Helper to format attendance badge color
  const getAttendanceBadgeColor = (percentage) => {
    if (percentage >= 90) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
    } else if (percentage >= 75) {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400';
    } else if (percentage >= 60) {
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400';
    } else {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
    }
  };

  // Force a refresh of the dashboard data
  const handleRefreshData = async () => {
    if (!user?.uid) {
      showError("You must be logged in to refresh data");
      return;
    }
    
    setLoading(true);
    try {
      // Fetch all schedules for this lecturer
      const schedulesQuery = query(
        collection(db, 'schedules'),
        where('lecturerId', '==', user.uid),
        orderBy('date', 'desc')
      );
      
      const schedulesSnapshot = await getDocs(schedulesQuery);
      const schedules = schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
      }));
      
      console.log("Manual refresh - found schedules:", schedules.length);
      
      // Calculate all the stats as before...
      let totalHours = schedules.reduce((total, schedule) => {
        const startTime = schedule.startTime?.split(':') || ['09', '00'];
        const endTime = schedule.endTime?.split(':') || ['11', '00'];
        
        const startDate = new Date(schedule.date);
        startDate.setHours(parseInt(startTime[0], 10), parseInt(startTime[1], 10));
        
        const endDate = new Date(schedule.date);
        endDate.setHours(parseInt(endTime[0], 10), parseInt(endTime[1], 10));
        
        const hours = differenceInHours(endDate, startDate) || 2;
        return total + hours;
      }, 0);
      
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      
      const thisMonthSchedules = schedules.filter(
        schedule => schedule.date >= monthStart && schedule.date <= monthEnd
      );
      
      const courseCompletion = Math.min(
        Math.floor((thisMonthSchedules.length / Math.max(schedules.length * 0.25, 1)) * 100),
        100
      );
      
      const upcomingLectures = schedules
        .filter(schedule => schedule.date >= now)
        .sort((a, b) => a.date - b.date)
        .slice(0, 3)
        .map(schedule => {
          const startTime = schedule.startTime || '09:00';
          const endTime = schedule.endTime || '11:00';
          const dateObj = new Date(schedule.date);
          
          return {
            id: schedule.id,
            title: schedule.title || 'Untitled Lecture',
            isToday: isSameDay(dateObj, now),
            isTomorrow: isSameDay(dateObj, new Date(now.getTime() + 86400000)),
            dateFormatted: format(dateObj, 'EEE, MMM d'),
            timeFormatted: `${startTime} - ${endTime}`,
            location: schedule.room || 'Not specified',
            type: schedule.type || 'lecture',
            attendance: Math.floor(Math.random() * 20) + 75
          };
        });
        
      const weeklyData = [0, 0, 0, 0, 0, 0, 0];
      
      schedules.forEach(schedule => {
        const date = new Date(schedule.date);
        const dayOfWeek = date.getDay();
        
        const startTime = schedule.startTime?.split(':') || ['09', '00'];
        const endTime = schedule.endTime?.split(':') || ['11', '00'];
        
        const startDate = new Date(schedule.date);
        startDate.setHours(parseInt(startTime[0], 10), parseInt(startTime[1], 10));
        
        const endDate = new Date(schedule.date);
        endDate.setHours(parseInt(endTime[0], 10), parseInt(endTime[1], 10));
        
        const hours = differenceInHours(endDate, startDate) || 2;
        weeklyData[dayOfWeek] += hours;
      });
      
      setStats({
        totalLectureHours: totalHours,
        totalLectures: schedules.length,
        averageAttendance: Math.floor(Math.random() * 15) + 80,
        courseCompletion,
        weeklyData,
        upcomingLectures
      });
      
      showSuccess("Dashboard refreshed successfully");
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      showError('Failed to refresh dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Top Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto px-4 py-5 md:px-6 md:py-6">
          {/* Welcome Banner */}
          <div className="bg-indigo-500 dark:bg-indigo-600 rounded-2xl overflow-hidden relative mb-8">
            <div className="p-6 md:p-8 max-w-xl">
              <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">
                Welcome Back, {user?.displayName || 'Lecturer'}!
              </h1>
              <p className="text-indigo-100 text-sm md:text-base mb-4">
                Track your lectures, monitor attendance and manage your teaching schedule all in one place.
              </p>
              <div className="flex gap-2">
                <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-medium text-sm rounded-lg px-4 py-2 transition-colors">
                  View Schedule
                </button>
                <button 
                  onClick={handleRefreshData}
                  className="bg-indigo-400 text-white hover:bg-indigo-300 font-medium text-sm rounded-lg px-4 py-2 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
              
              <div className="absolute right-0 bottom-0 hidden md:block">
                <img 
                  src="https://cdn3d.iconscout.com/3d/premium/thumb/teacher-5796558-4841569.png" 
                  alt="Teacher illustration" 
                  className="h-32 md:h-48 transform translate-x-5"
                />
              </div>
            </div>
          </div>
          
          {/* Debug Info - only visible during development */}
          {(import.meta.env.MODE === 'development' || import.meta.env.DEV) && (
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6 text-sm">
              <h4 className="font-semibold mb-2">Debug Information</h4>
              <div>User ID: {user?.uid || 'Not logged in'}</div>
              <div>Lecture Count: {stats.totalLectures}</div>
              <div>Loading State: {loading ? 'Loading...' : 'Completed'}</div>
            </div>
          )}
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Lectures</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      `${stats.totalLectureHours}h`
                    )}
                  </h3>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="flex items-center text-green-500 text-sm">
                <span className="font-medium">+{Math.floor(stats.totalLectures/10)}%</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">from last week</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Average Attendance</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      `${stats.averageAttendance}%`
                    )}
                  </h3>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex items-center text-green-500 text-sm">
                <span className="font-medium">+3%</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">from last semester</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Course Completion</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {loading ? (
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ) : (
                      `${stats.courseCompletion}%`
                    )}
                  </h3>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex items-center text-yellow-500 text-sm">
                <span className="font-medium">On track</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">for semester goals</span>
              </div>
            </div>
          </div>
          
          {/* Time Spent & Attendance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Time Spent Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white">Time Spent</h3>
                <div className="relative">
                  <select className="text-xs bg-gray-100 dark:bg-gray-700 border-0 rounded px-2 py-1 appearance-none pr-6 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option>Last Week</option>
                    <option>This Month</option>
                    <option>Last Month</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Bar Chart */}
              <div className="h-40 flex items-end justify-between">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                  // Calculate bar height based on real data
                  const maxHours = Math.max(...stats.weeklyData, 1); // Avoid division by zero
                  const heightPercent = (stats.weeklyData[index] / maxHours) * 100;
                  
                  const colors = [
                    'bg-pink-200 dark:bg-pink-900/50',
                    'bg-yellow-200 dark:bg-yellow-900/50',
                    'bg-green-200 dark:bg-green-900/50',
                    'bg-blue-200 dark:bg-blue-900/50',
                    'bg-purple-200 dark:bg-purple-900/50',
                    'bg-orange-200 dark:bg-orange-900/50',
                    'bg-teal-200 dark:bg-teal-900/50'
                  ];
                  
                  return (
                    <div key={index} className="flex flex-col items-center justify-end">
                      {loading ? (
                        <div className="w-9 h-24 bg-gray-200 dark:bg-gray-700 rounded-t-md animate-pulse"></div>
                      ) : (
                        <div 
                          className={`w-9 ${colors[index]} rounded-t-md flex flex-col items-center justify-end`} 
                          style={{ height: `${Math.max(heightPercent, 5)}%` }}
                        >
                          {stats.weeklyData[index] > 0 && (
                            <div className="text-[10px] text-center font-medium pt-1">
                              {stats.weeklyData[index]}h
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{day}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Attendance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Attendance Overview</h3>
                <div className="relative">
                  <select className="text-xs bg-gray-100 dark:bg-gray-700 border-0 rounded px-2 py-1 appearance-none pr-6 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option>All Courses</option>
                    <option>Software Engineering</option>
                    <option>Database Systems</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center my-4">
                {/* Pie Chart */}
                {loading ? (
                  <div className="h-40 w-40 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                ) : (
                  <div className="relative h-40 w-40">
                    <svg viewBox="0 0 36 36" className="h-full w-full">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="3"
                        className="dark:stroke-gray-700"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth="3"
                        strokeDasharray={`${stats.averageAttendance}, 100`}
                        className="dark:stroke-indigo-500"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="3"
                        strokeDasharray="10, 100"
                        strokeDashoffset="-85"
                        className="dark:stroke-amber-500"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="3"
                        strokeDasharray="5, 100"
                        strokeDashoffset="-95"
                        className="dark:stroke-red-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.averageAttendance}%</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Attendance</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-3 text-center gap-2 mt-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Present</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round((stats.totalLectures * stats.averageAttendance) / 100)}
                  </div>
                  <div className="h-1.5 w-12 bg-indigo-500 mx-auto mt-1 rounded-full"></div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Late</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round(stats.totalLectures * 0.1)}
                  </div>
                  <div className="h-1.5 w-12 bg-amber-500 mx-auto mt-1 rounded-full"></div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Absent</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round(stats.totalLectures * 0.05)}
                  </div>
                  <div className="h-1.5 w-12 bg-red-500 mx-auto mt-1 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Upcoming Lectures */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Lectures</h3>
              <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View All</button>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                // Loading skeleton
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-600 p-2.5 rounded-lg mr-3 h-10 w-10"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded h-6 w-24"></div>
                  </div>
                ))
              ) : stats.upcomingLectures.length > 0 ? (
                // Real upcoming lectures
                stats.upcomingLectures.map((lecture, index) => (
                  <div key={index} className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className={`${getLectureTypeColor(lecture.type)} p-2.5 rounded-lg mr-3`}>
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{lecture.title}</h4>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {lecture.isToday ? 'Today' : lecture.isTomorrow ? 'Tomorrow' : lecture.dateFormatted} • {lecture.timeFormatted}
                        </span>
                        <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{lecture.location}</span>
                      </div>
                    </div>
                    <div className={`${getAttendanceBadgeColor(lecture.attendance)} px-2 py-1 rounded text-xs font-medium`}>
                      {lecture.attendance}% Attendance
                    </div>
                  </div>
                ))
              ) : (
                // No upcoming lectures
                <div className="flex items-center justify-center p-6 text-center">
                  <div className="max-w-sm">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                      <CalendarIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h4 className="text-gray-700 dark:text-gray-300 font-medium mb-1">No Upcoming Lectures</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No lectures scheduled for the upcoming days. Use the calendar to schedule new lectures.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Dashboard;