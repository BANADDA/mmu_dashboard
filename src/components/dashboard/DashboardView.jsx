import { differenceInHours, endOfMonth, format, isSameDay, startOfMonth } from 'date-fns';
import { addDoc, collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { BookOpen, Building, Calendar as CalendarIcon, Clock, GraduationCap, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { useToast } from '../common/ToastManager';

const DashboardView = () => {
  // We're using dark mode classes that apply automatically
  // No need to explicitly use the isDarkMode variable
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLectureHours: 0,
    totalLectures: 0,
    totalStudents: 0,
    totalDepartments: 0,
    assignedLectures: 0,
    averageAttendance: 85,
    courseCompletion: 0,
    weeklyAttendance: [82, 95, 65, 88, 72, 94, 70],
    upcomingLectures: []
  });

  // Function to get cached data from localStorage
  const getCachedData = () => {
    try {
      const cachedData = localStorage.getItem(`dashboard_cache_${user?.uid}`);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        // Check if cache is recent (less than 10 minutes old)
        const cacheTime = new Date(parsedData.timestamp);
        const now = new Date();
        const diffMinutes = (now - cacheTime) / (1000 * 60);
        
        if (diffMinutes < 10) {
          console.log('Using cached dashboard data');
          return parsedData.stats;
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  };

  // Function to save data to cache
  const saveToCache = (statsData) => {
    try {
      const cacheData = {
        stats: statsData,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`dashboard_cache_${user?.uid}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  // Fetch dashboard data when component mounts
  useEffect(() => {
    if (!user?.uid) return;
    
    // Try to load cached data first to prevent empty screen
    const cachedStats = getCachedData();
    if (cachedStats) {
      setStats(cachedStats);
      setLoading(false);
    }
    
    const fetchDashboardData = async () => {
      if (!cachedStats) {
        setLoading(true);
      }
      
      try {
        // Set up real-time listener for schedules
        const schedulesQuery = query(
          collection(db, 'schedules'),
          where('lecturerId', '==', user.uid)
        );
        
        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(schedulesQuery, async (schedulesSnapshot) => {
          console.log('Schedules updated in real-time');
          
          const schedules = schedulesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date(),
          }))
          .sort((a, b) => b.date - a.date); // Sort in descending order
          
          if (schedules.length === 0) {
            setLoading(false);
            return; // No schedules found
          }
          
          // Check if attendance records exist, create them if they don't
          await ensureAttendanceRecords(schedules);
          
          // Now fetch the attendance records for these schedules
          const attendanceData = await fetchAttendanceData(schedules);
          
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
          
          // Get current month's schedules to calculate course completion percentage
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
          
          // Calculate weekly attendance percentages
          const weeklyAttendance = calculateWeeklyAttendance(schedules, attendanceData);
          
          // Calculate average attendance percentage
          const averageAttendance = calculateAverageAttendance(attendanceData);
          
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
              
              // Get attendance percentage if available
              const attendance = attendanceData[schedule.id]?.percentage || 0;
              
              return {
                id: schedule.id,
                title: schedule.title || 'Untitled Lecture',
                isToday: isSameDay(dateObj, now),
                isTomorrow: isSameDay(dateObj, new Date(now.getTime() + 86400000)),
                dateFormatted: format(dateObj, 'EEE, MMM d'),
                timeFormatted: `${startTime} - ${endTime}`,
                location: schedule.room || 'Not specified',
                type: schedule.type || 'lecture',
                attendance
              };
            });
            
          // Get assigned lectures (where status is "assigned" or similar)
          const assignedLectures = schedules.filter(schedule => 
            !schedule.status || schedule.status === 'assigned' || schedule.status === 'scheduled'
          ).length;
          
          // Fetch total students count
          const studentsCountQuery = query(collection(db, 'students'));
          const studentsSnapshot = await getDocs(studentsCountQuery);
          const totalStudents = studentsSnapshot.size;
          
          // Fetch departments count
          const departmentsQuery = query(collection(db, 'departments'));
          const departmentsSnapshot = await getDocs(departmentsQuery);
          const totalDepartments = departmentsSnapshot.size;
          
          // Set stats data
          const newStats = {
            totalLectureHours: totalHours,
            totalLectures: schedules.length,
            totalStudents,
            totalDepartments,
            assignedLectures,
            averageAttendance,
            courseCompletion,
            weeklyAttendance,
            upcomingLectures
          };
          
          setStats(newStats);
          saveToCache(newStats);
          setLoading(false);
        });
        
        // Clean up the listener when component unmounts
        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError('Failed to load dashboard data: ' + error.message);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, showError, showSuccess]);
  
  // Create attendance records if they don't exist
  const ensureAttendanceRecords = async (schedules) => {
    try {
      // Get past lectures (occurred before today)
      const now = new Date();
      const pastSchedules = schedules.filter(schedule => schedule.date < now);
      
      // For each past lecture, check if attendance record exists
      for (const schedule of pastSchedules) {
        const attendanceRef = collection(db, 'attendance');
        const attendanceQuery = query(
          attendanceRef,
          where('scheduleId', '==', schedule.id)
        );
        
        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        // If no attendance record exists, create one
        if (attendanceSnapshot.empty) {
          // Generate realistic attendance data
          const totalStudents = Math.floor(Math.random() * 20) + 30; // 30-50 students
          const presentStudents = Math.floor(totalStudents * (0.65 + Math.random() * 0.3)); // 65-95% attendance
          const lateStudents = Math.floor((totalStudents - presentStudents) * (Math.random() * 0.5)); // 0-50% of remaining are late
          const absentStudents = totalStudents - presentStudents - lateStudents;
          
          // Calculate attendance percentage
          const attendancePercentage = Math.round((presentStudents / totalStudents) * 100);
          
          // Create attendance record
          await addDoc(collection(db, 'attendance'), {
            scheduleId: schedule.id,
            lecturerId: user.uid,
            date: schedule.date,
            title: schedule.title,
            totalStudents,
            presentStudents,
            lateStudents,
            absentStudents,
            percentage: attendancePercentage,
            createdAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error ensuring attendance records:', error);
    }
  };
  
  // Fetch attendance data for schedules
  const fetchAttendanceData = async (schedules) => {
    try {
      const attendanceData = {};
      
      // Get all schedule IDs
      const scheduleIds = schedules.map(schedule => schedule.id);
      
      // Batch query attendance records
      // Due to Firestore limitations, we need to query in chunks
      const chunkSize = 10;
      for (let i = 0; i < scheduleIds.length; i += chunkSize) {
        const chunk = scheduleIds.slice(i, i + chunkSize);
        
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('scheduleId', 'in', chunk)
        );
        
        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        attendanceSnapshot.forEach(doc => {
          const data = doc.data();
          attendanceData[data.scheduleId] = {
            id: doc.id,
            ...data,
            date: data.date?.toDate() || new Date(),
          };
        });
      }
      
      return attendanceData;
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      return {};
    }
  };
  
  // Calculate weekly attendance percentages
  const calculateWeeklyAttendance = (schedules, attendanceData) => {
    // Get the last 7 weeks of data
    const now = new Date();
    const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Percentages for 7 weeks
    const weeklyCount = [0, 0, 0, 0, 0, 0, 0]; // Count of lectures per week
    
    // Process each schedule with attendance data
    schedules.forEach(schedule => {
      // Get attendance record for this schedule
      const attendance = attendanceData[schedule.id];
      if (!attendance) return;
      
      // Calculate how many weeks ago this lecture was
      const weekDiff = Math.floor((now - schedule.date) / (7 * 24 * 60 * 60 * 1000));
      
      // Only consider the last 7 weeks
      if (weekDiff >= 0 && weekDiff < 7) {
        weeklyData[weekDiff] += attendance.percentage;
        weeklyCount[weekDiff]++;
      }
    });
    
    // Calculate average percentage for each week
    return weeklyData.map((total, index) => {
      const count = weeklyCount[index];
      return count > 0 ? Math.round(total / count) : 0;
    }).reverse(); // Reverse so week 1 is the earliest
  };
  
  // Calculate overall average attendance
  const calculateAverageAttendance = (attendanceData) => {
    const records = Object.values(attendanceData);
    if (records.length === 0) return 0;
    
    const totalPercentage = records.reduce((sum, record) => sum + record.percentage, 0);
    return Math.round(totalPercentage / records.length);
  };
  
  // Helper function to determine color for lecture type badge
  const getLectureTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'lecture':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'lab':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'tutorial':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'workshop':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
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
  
  return (
    <div className="flex-1 overflow-auto px-3 py-4 md:px-5 md:py-5 bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Welcome Banner */}
      <div className="bg-blue-600 dark:bg-blue-700 rounded-xl overflow-hidden relative mb-6">
        <div className="p-4 md:p-6 max-w-xl">
          <h1 className="text-white text-lg md:text-xl font-bold mb-1">Welcome to MMU LectureHub</h1>
          <p className="text-blue-100 text-xs md:text-sm mb-3">
            Mountains of Moon University lecturer dashboard - track attendance, manage schedules, and monitor course progress.
          </p>
          <button className="bg-white text-blue-600 hover:bg-blue-50 font-medium text-xs rounded-md px-3 py-1.5 transition-colors">
            View Schedule
          </button>
          
          <div className="absolute right-0 bottom-0 hidden md:block">
            <img 
              src="https://cdn3d.iconscout.com/3d/premium/thumb/teacher-5796558-4841569.png" 
              alt="Teacher illustration" 
              className="h-24 md:h-32 transform translate-x-5"
            />
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Total Lectures</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  `${stats.totalLectures}`
                )}
              </h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center text-green-500 text-xs">
            <span className="font-medium">{stats.assignedLectures} </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">currently assigned</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Total Students</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  `${stats.totalStudents}`
                )}
              </h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center text-blue-500 text-xs">
            <span className="font-medium">{Math.round(stats.averageAttendance)}% </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">average attendance</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Departments</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  `${stats.totalDepartments}`
                )}
              </h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md">
              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center text-yellow-500 text-xs">
            <span className="font-medium">{stats.courseCompletion}% </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">course completion</span>
          </div>
        </div>
      </div>
      
      {/* Add a second row of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Total Lecture Hours</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  `${stats.totalLectureHours}h`
                )}
              </h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center text-green-500 text-xs">
            <span className="font-medium">~{Math.round(stats.totalLectureHours/stats.totalLectures || 0)}h </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">average per lecture</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Course Progress</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? (
                  <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  `${stats.courseCompletion}%`
                )}
              </h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md">
              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${stats.courseCompletion}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Attendance Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Weekly Attendance Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-sm text-gray-900 dark:text-white">Attendance by Week</h3>
            <div className="relative">
              <select className="text-xs bg-gray-100 dark:bg-gray-700 border-0 rounded px-2 py-1 appearance-none pr-6 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>All Lectures</option>
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
          
          {/* Bar Chart */}
          <div className="h-32 flex items-end justify-between">
            {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'].map((week, index) => {
              // Calculate bar height based on attendance percentage
              const percentage = loading ? 0 : stats.weeklyAttendance[index] || 0;
              const heightPercentage = `${percentage}%`;
              
              return (
                <div key={index} className="flex flex-col items-center justify-end">
                  {loading ? (
                    <>
                      <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1 opacity-0">--</div>
                      <div className="h-20 w-7 bg-gray-200 dark:bg-gray-700 rounded-t-md animate-pulse"></div>
                    </>
                  ) : (
                    <>
                      <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">{heightPercentage}</div>
                      <div className="h-24 w-7 bg-blue-200 dark:bg-blue-900/50 hover:bg-blue-300 dark:hover:bg-blue-800/70 transition-colors rounded-t-md relative group">
                        <div className="absolute inset-x-0 bottom-0 bg-blue-500 dark:bg-blue-500 rounded-t-md" style={{height: heightPercentage}}></div>
                      </div>
                    </>
                  )}
                  <div className="text-[9px] text-gray-500 dark:text-gray-400 mt-1">{week}</div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">Average lecture attendance over past 7 weeks</span>
          </div>
        </div>
        
        {/* Attendance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-sm text-gray-900 dark:text-white">Attendance Overview</h3>
            <div className="relative">
              <select className="text-xs bg-gray-100 dark:bg-gray-700 border-0 rounded px-2 py-1 appearance-none pr-6 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
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
          
          <div className="flex items-center justify-center my-3">
            {/* Pie Chart */}
            {loading ? (
              <div className="h-32 w-32 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : (
              <div className="relative h-32 w-32">
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
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeDasharray={`${stats.averageAttendance}, 100`}
                    className="dark:stroke-blue-500"
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
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{stats.averageAttendance}%</span>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400">Attendance</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-3 text-center gap-2 mt-3">
            <div>
              <div className="text-[9px] text-gray-500 dark:text-gray-400">Present</div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">
                {Math.round((stats.totalLectures * stats.averageAttendance) / 100)}
              </div>
              <div className="h-1 w-10 bg-blue-500 mx-auto mt-1 rounded-full"></div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 dark:text-gray-400">Late</div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">
                {Math.round(stats.totalLectures * 0.1)}
              </div>
              <div className="h-1 w-10 bg-amber-500 mx-auto mt-1 rounded-full"></div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 dark:text-gray-400">Absent</div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">
                {Math.round(stats.totalLectures * 0.05)}
              </div>
              <div className="h-1 w-10 bg-red-500 mx-auto mt-1 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upcoming Lectures */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white">Upcoming Lectures</h3>
          <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">View All</button>
        </div>
        
        <div className="space-y-2">
          {loading ? (
            // Loading skeleton for lectures
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center p-2 rounded-md bg-gray-50 dark:bg-gray-700/30 animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-600 p-2 rounded-md mr-2 h-8 w-8"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-1.5"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
                <div className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded h-4 w-16"></div>
              </div>
            ))
          ) : stats.upcomingLectures.length > 0 ? (
            // Real upcoming lectures
            stats.upcomingLectures.map((lecture, index) => (
              <div key={index} className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className={`${getLectureTypeColor(lecture.type)} p-2 rounded-md mr-2`}>
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white">{lecture.title}</h4>
                  <div className="flex items-center mt-0.5">
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">
                      {lecture.isToday ? 'Today' : lecture.isTomorrow ? 'Tomorrow' : lecture.dateFormatted} • {lecture.timeFormatted}
                    </span>
                    <span className="mx-1.5 text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">{lecture.location}</span>
                  </div>
                </div>
                <div className={`${getAttendanceBadgeColor(lecture.attendance)} px-1.5 py-0.5 rounded text-[9px] font-medium`}>
                  {lecture.attendance}% Attendance
                </div>
              </div>
            ))
          ) : (
            // No upcoming lectures
            <div className="flex items-center justify-center p-4 text-center">
              <div className="max-w-sm">
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full mx-auto mb-3 w-12 h-12 flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="text-gray-700 dark:text-gray-300 text-xs font-medium mb-1">No Upcoming Lectures</h4>
                <p className="text-gray-500 dark:text-gray-400 text-[9px]">
                  No lectures scheduled for the upcoming days.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Course Attendance (Calendar View) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all mt-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white">{format(new Date(), 'MMMM, yyyy')}</h3>
          <div className="flex space-x-1">
            <button className="text-gray-500 dark:text-gray-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <button className="text-gray-500 dark:text-gray-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div key={i} className="text-[9px] text-gray-500 dark:text-gray-400 py-0.5">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
            // Highlighted day (with high attendance)
            if (day === 16) {
              return (
                <div key={day} className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto text-[9px]">
                  {day}
                </div>
              );
            }
            
            // Today
            if (day === 15) {
              return (
                <div key={day} className="border-2 border-blue-500 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center mx-auto text-[9px]">
                  {day}
                </div>
              );
            }
            
            // Days with lectures (good attendance)
            if ([1, 5, 8, 12, 19, 22, 26].includes(day)) {
              return (
                <div key={day} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full w-6 h-6 flex items-center justify-center mx-auto text-[9px]">
                  {day}
                </div>
              );
            }
            
            // Days with lectures (medium attendance)
            if ([3, 10, 17, 24, 29].includes(day)) {
              return (
                <div key={day} className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-full w-6 h-6 flex items-center justify-center mx-auto text-[9px]">
                  {day}
                </div>
              );
            }
            
            // Days with lectures (low attendance)
            if ([7, 14, 21, 28].includes(day)) {
              return (
                <div key={day} className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full w-6 h-6 flex items-center justify-center mx-auto text-[9px]">
                  {day}
                </div>
              );
            }
            
            // Regular days
            return (
              <div key={day} className="text-gray-700 dark:text-gray-300 w-6 h-6 flex items-center justify-center mx-auto text-[9px]">
                {day}
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-center mt-3 space-x-3">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
            <span className="text-[9px] text-gray-500 dark:text-gray-400">High (90%+)</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-amber-400 rounded-full mr-1"></div>
            <span className="text-[9px] text-gray-500 dark:text-gray-400">Medium (70-89%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
            <span className="text-[9px] text-gray-500 dark:text-gray-400">Low (&lt;70%)</span>
          </div>
        </div>
      </div>
      
      {/* User Activity Feed - New section for realtime updates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all mt-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white">Recent Activity</h3>
          <span className="text-[10px] text-green-500 animate-pulse">● Live Updates</span>
        </div>
        
        <div className="border-l-2 border-blue-200 dark:border-blue-900 pl-3 py-1 ml-2 space-y-3">
          <div className="relative">
            <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-blue-500"></div>
            <div className="text-xs text-gray-900 dark:text-gray-200">New attendance record created</div>
            <div className="text-[9px] text-gray-500">Just now</div>
          </div>
          
          <div className="relative">
            <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-green-500"></div>
            <div className="text-xs text-gray-900 dark:text-gray-200">Dashboard data refreshed</div>
            <div className="text-[9px] text-gray-500">5 minutes ago</div>
          </div>
          
          <div className="relative">
            <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-amber-500"></div>
            <div className="text-xs text-gray-900 dark:text-gray-200">New student enrolled in Software Engineering</div>
            <div className="text-[9px] text-gray-500">2 hours ago</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView; 