import { Calendar as CalendarIcon, Clock, GraduationCap, Users } from 'lucide-react';

const DashboardView = () => {
  // We're using dark mode classes that apply automatically
  // No need to explicitly use the isDarkMode variable
  
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
              <p className="text-gray-500 dark:text-gray-400 text-xs">Total Lecture Hours</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">48h</h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center text-green-500 text-xs">
            <span className="font-medium">+9% </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">from last week</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Average Attendance</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">87%</h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center text-green-500 text-xs">
            <span className="font-medium">+3% </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">from last semester</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Course Completion</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">40%</h3>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md">
              <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex items-center text-yellow-500 text-xs">
            <span className="font-medium">On track </span>
            <span className="text-gray-600 dark:text-gray-400 ml-1">for semester goals</span>
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
              const heights = ['h-20', 'h-24', 'h-16', 'h-22', 'h-18', 'h-24', 'h-16'];
              const percentages = ['82%', '95%', '65%', '88%', '72%', '94%', '70%'];
              
              return (
                <div key={index} className="flex flex-col items-center justify-end">
                  <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1">{percentages[index]}</div>
                  <div className={`${heights[index]} w-7 bg-blue-200 dark:bg-blue-900/50 hover:bg-blue-300 dark:hover:bg-blue-800/70 transition-colors rounded-t-md relative group`}>
                    <div className="absolute inset-x-0 bottom-0 bg-blue-500 dark:bg-blue-500 rounded-t-md" style={{height: percentages[index]}}></div>
                  </div>
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
                  strokeDasharray="85, 100"
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
                <span className="text-xl font-bold text-gray-900 dark:text-white">85%</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400">Attendance</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 text-center gap-2 mt-3">
            <div>
              <div className="text-[9px] text-gray-500 dark:text-gray-400">Present</div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">5,000</div>
              <div className="h-1 w-10 bg-blue-500 mx-auto mt-1 rounded-full"></div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 dark:text-gray-400">Late</div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">750</div>
              <div className="h-1 w-10 bg-amber-500 mx-auto mt-1 rounded-full"></div>
            </div>
            <div>
              <div className="text-[9px] text-gray-500 dark:text-gray-400">Absent</div>
              <div className="text-xs font-medium text-gray-900 dark:text-white">250</div>
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
          {/* Lecture Item 1 */}
          <div className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md mr-2">
              <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-medium text-gray-900 dark:text-white">Software Engineering Lecture</h4>
              <div className="flex items-center mt-0.5">
                <span className="text-[9px] text-gray-500 dark:text-gray-400">Today • 09:00 - 11:00</span>
                <span className="mx-1.5 text-gray-300 dark:text-gray-600">•</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400">Block A - Room 101</span>
              </div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded text-[9px] font-medium text-green-800 dark:text-green-400">
              85% Attendance
            </div>
          </div>
          
          {/* Lecture Item 2 */}
          <div className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-md mr-2">
              <CalendarIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-medium text-gray-900 dark:text-white">Database Systems Lab</h4>
              <div className="flex items-center mt-0.5">
                <span className="text-[9px] text-gray-500 dark:text-gray-400">Tomorrow • 14:00 - 16:00</span>
                <span className="mx-1.5 text-gray-300 dark:text-gray-600">•</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400">Block B - Lab 203</span>
              </div>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-[9px] font-medium text-amber-800 dark:text-amber-400">
              78% Attendance
            </div>
          </div>
          
          {/* Lecture Item 3 */}
          <div className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-md mr-2">
              <CalendarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-medium text-gray-900 dark:text-white">Web Development Tutorial</h4>
              <div className="flex items-center mt-0.5">
                <span className="text-[9px] text-gray-500 dark:text-gray-400">Wed, Jun 22 • 15:00 - 17:00</span>
                <span className="mx-1.5 text-gray-300 dark:text-gray-600">•</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400">Block A - Room 105</span>
              </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-[9px] font-medium text-blue-800 dark:text-blue-400">
              92% Attendance
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Attendance (Calendar View) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all mt-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-sm text-gray-900 dark:text-white">June, 2024</h3>
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
    </div>
  );
};

export default DashboardView; 