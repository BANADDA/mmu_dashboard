import { Calendar as CalendarIcon, Clock, GraduationCap, Users } from 'lucide-react';
import BottomNav from '../layout/BottomNav';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';

const Dashboard = () => {
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
              <h1 className="text-white text-2xl md:text-3xl font-bold mb-2">Welcome Back, Robert Fox!</h1>
              <p className="text-indigo-100 text-sm md:text-base mb-4">
                Track your lectures, monitor attendance and manage your teaching schedule all in one place.
              </p>
              <button className="bg-white text-indigo-600 hover:bg-indigo-50 font-medium text-sm rounded-lg px-4 py-2 transition-colors">
                View Schedule
              </button>
              
              <div className="absolute right-0 bottom-0 hidden md:block">
                <img 
                  src="https://cdn3d.iconscout.com/3d/premium/thumb/teacher-5796558-4841569.png" 
                  alt="Teacher illustration" 
                  className="h-32 md:h-48 transform translate-x-5"
                />
              </div>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Lectures</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">48h</h3>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="flex items-center text-green-500 text-sm">
                <span className="font-medium">+9% </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">from last week</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Average Attendance</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">87%</h3>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="flex items-center text-green-500 text-sm">
                <span className="font-medium">+3% </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">from last semester</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Course Completion</p>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">40%</h3>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex items-center text-yellow-500 text-sm">
                <span className="font-medium">On track </span>
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
                  const heights = ['h-24', 'h-36', 'h-20', 'h-28', 'h-24', 'h-28', 'h-12'];
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
                      <div className={`${heights[index]} w-9 ${colors[index]} rounded-t-md`}></div>
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
                      strokeDasharray="85, 100"
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
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">85%</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Attendance</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 text-center gap-2 mt-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Present</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">5,000</div>
                  <div className="h-1.5 w-12 bg-indigo-500 mx-auto mt-1 rounded-full"></div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Late</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">750</div>
                  <div className="h-1.5 w-12 bg-amber-500 mx-auto mt-1 rounded-full"></div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Absent</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">250</div>
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
              {/* Lecture Item 1 */}
              <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-lg mr-3">
                  <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Software Engineering Lecture</h4>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Today • 09:00 - 11:00</span>
                    <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Block A - Room 101</span>
                  </div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs font-medium text-green-800 dark:text-green-400">
                  85% Attendance
                </div>
              </div>
              
              {/* Lecture Item 2 */}
              <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-lg mr-3">
                  <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Database Systems Lab</h4>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Tomorrow • 14:00 - 16:00</span>
                    <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Block B - Lab 203</span>
                  </div>
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded text-xs font-medium text-amber-800 dark:text-amber-400">
                  78% Attendance
                </div>
              </div>
              
              {/* Lecture Item 3 */}
              <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-lg mr-3">
                  <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Web Development Tutorial</h4>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Wed, Jun 22 • 15:00 - 17:00</span>
                    <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Block A - Room 105</span>
                  </div>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs font-medium text-blue-800 dark:text-blue-400">
                  92% Attendance
                </div>
              </div>
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