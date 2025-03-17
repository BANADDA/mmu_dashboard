import { addDays, format, parseISO, subDays } from 'date-fns';
import {
    BarChart3,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Filter,
    Search,
    Users,
    X
} from 'lucide-react';
import { useState } from 'react';

const LectureHistoryView = () => {
  const [filterDate, setFilterDate] = useState(new Date());
  const [filterCourse, setFilterCourse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Sample courses data
  const courses = [
    { id: 'all', name: 'All Courses' },
    { id: 'csc301', name: 'CSC 301 - Software Engineering' },
    { id: 'csc302', name: 'CSC 302 - Database Systems' },
    { id: 'ele201', name: 'ELE 201 - Digital Electronics' },
    { id: 'bus401', name: 'BUS 401 - Business Analytics' },
  ];
  
  // Sample student names that will be reused across different lectures
  const studentNames = [
    'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Robert Brown',
    'Alex Johnson', 'Emma Davis', 'Ryan Thompson', 'Olivia Martin', 'Daniel Wilson',
    'Sophia Miller', 'James Taylor', 'Isabella Anderson', 'William Moore', 'Mia Thomas',
    'Benjamin White', 'Charlotte Harris', 'Jacob Martin', 'Amelia Clark', 'Lucas King',
    'Harper Scott', 'Ethan Green', 'Ava Baker', 'Noah Hall', 'Ella Young',
    'Liam Allen', 'Lily Wright', 'Logan Hill', 'Grace Nelson', 'Mason Carter'
  ];
  
  // Function to generate random attendance data for a course
  const generateAttendanceData = (totalStudents, absentCount) => {
    const attendance = [];
    
    // Shuffle student names to randomize the order
    const shuffledNames = [...studentNames].sort(() => 0.5 - Math.random());
    
    // Generate attendance data for each student
    for (let i = 0; i < totalStudents; i++) {
      const isPresent = i >= absentCount;
      const timeIn = isPresent 
        ? `${Math.floor(Math.random() * 2) + 9}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM` 
        : null;
        
      attendance.push({
        id: i + 1,
        name: shuffledNames[i % shuffledNames.length],
        present: isPresent,
        timein: timeIn
      });
    }
    
    return attendance;
  };
  
  // Sample lecture history data
  const [lectureHistory] = useState([
    {
      id: 1,
      courseCode: 'CSC 301',
      courseId: 'csc301',
      courseName: 'Software Engineering',
      date: '2024-03-12',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      location: 'Room 203, Computer Science Building',
      studentsPresent: 42,
      totalStudents: 45,
      attendancePercentage: 93,
      notes: 'Covered design patterns and SOLID principles. Students showed good understanding of the topic.',
      attendance: generateAttendanceData(45, 3)
    },
    {
      id: 2,
      courseCode: 'CSC 302',
      courseId: 'csc302',
      courseName: 'Database Systems',
      date: '2024-03-12',
      startTime: '2:00 PM',
      endTime: '4:00 PM',
      location: 'Lab 101, Technology Center',
      studentsPresent: 36,
      totalStudents: 38,
      attendancePercentage: 95,
      notes: 'Conducted a lab session on database normalization. Students successfully designed and normalized a sample database.',
      attendance: generateAttendanceData(38, 2)
    },
    {
      id: 3,
      courseCode: 'ELE 201',
      courseId: 'ele201',
      courseName: 'Digital Electronics',
      date: '2024-03-11',
      startTime: '1:00 PM',
      endTime: '2:30 PM',
      location: 'Lab 303, Engineering Building',
      studentsPresent: 48,
      totalStudents: 52,
      attendancePercentage: 92,
      notes: 'Practical session on logic gates and circuit design. Students built and tested basic circuits.',
      attendance: generateAttendanceData(52, 4)
    },
    {
      id: 4,
      courseCode: 'BUS 401',
      courseId: 'bus401',
      courseName: 'Business Analytics',
      date: '2024-03-10',
      startTime: '9:00 AM',
      endTime: '10:30 AM',
      location: 'Room 405, Business Complex',
      studentsPresent: 60,
      totalStudents: 63,
      attendancePercentage: 95,
      notes: 'Lecture on data visualization techniques. Students presented their analysis of case studies.',
      attendance: generateAttendanceData(63, 3)
    },
    {
      id: 5,
      courseCode: 'CSC 301',
      courseId: 'csc301',
      courseName: 'Software Engineering',
      date: '2024-03-10',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      location: 'Room 203, Computer Science Building',
      studentsPresent: 40,
      totalStudents: 45,
      attendancePercentage: 89,
      notes: 'Discussed software testing methodologies. Assigned group projects for the midterm.',
      attendance: generateAttendanceData(45, 5)
    },
    {
      id: 6,
      courseCode: 'CSC 301',
      courseId: 'csc301',
      courseName: 'Software Engineering',
      date: '2024-03-13',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      location: 'Room 203, Computer Science Building',
      studentsPresent: 43,
      totalStudents: 45,
      attendancePercentage: 96,
      notes: 'Covered software architecture and deployment strategies. Students were highly engaged with the material.',
      attendance: generateAttendanceData(45, 2)
    },
    {
      id: 7,
      courseCode: 'ELE 201',
      courseId: 'ele201',
      courseName: 'Digital Electronics',
      date: '2024-03-13',
      startTime: '1:00 PM',
      endTime: '2:30 PM',
      location: 'Lab 303, Engineering Building',
      studentsPresent: 50,
      totalStudents: 52,
      attendancePercentage: 96,
      notes: 'Sequential circuit design lab. Students implemented flip-flops and registers. Excellent participation.',
      attendance: generateAttendanceData(52, 2)
    }
  ]);

  const filteredLectures = lectureHistory.filter(lecture => {
    const matchesCourse = filterCourse === 'all' || lecture.courseId === filterCourse;
    const matchesSearch = 
      lecture.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecture.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Simplified date filtering (in a real app, you'd use proper date comparison)
    const lectureDate = format(parseISO(lecture.date), 'yyyy-MM-dd');
    const selectedDate = format(filterDate, 'yyyy-MM-dd');
    const matchesDate = lectureDate === selectedDate;
    
    return matchesCourse && matchesSearch && matchesDate;
  });

  // Change date filter (previous day)
  const handlePrevDay = () => {
    setFilterDate(prevDate => subDays(prevDate, 1));
  };

  // Change date filter (next day)
  const handleNextDay = () => {
    setFilterDate(prevDate => addDays(prevDate, 1));
  };

  // Handle lecture selection
  const handleSelectLecture = (lecture) => {
    setSelectedLecture(lecture);
  };
  
  // Handle attendance download
  const handleDownloadAttendance = () => {
    if (!selectedLecture) return;
    
    setIsExporting(true);
    
    try {
      // Generate CSV content
      const headers = ['Student ID', 'Student Name', 'Status', 'Time In'];
      const csvRows = [headers.join(',')];
      
      // Add student attendance data
      selectedLecture.attendance.forEach((student, idx) => {
        const row = [
          idx + 1,
          `"${student.name}"`, // Wrap in quotes to handle names with commas
          student.present ? 'Present' : 'Absent',
          student.timein || ''
        ];
        csvRows.push(row.join(','));
      });
      
      // Create and download the CSV file
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_${selectedLecture.courseCode}_${selectedLecture.date}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message or notification here if needed
    } catch (error) {
      console.error('Error exporting attendance:', error);
      // Show error message or notification here if needed
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Page Title and Filters Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Lecture History</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">View attendance records and lecture details</p>
          </div>
          
          <div className="mt-3 md:mt-0 flex items-center space-x-2">
            {/* Date Navigation */}
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <button 
                onClick={handlePrevDay}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="px-2 py-1 text-sm text-gray-900 dark:text-gray-200 font-medium">
                {format(filterDate, 'MMM dd, yyyy')}
              </div>
              
              <button 
                onClick={handleNextDay}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="p-1.5 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <Filter className="h-4 w-4 mr-1" />
              <span className="text-xs">Filters</span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search lectures..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={format(filterDate, 'yyyy-MM-dd')}
                onChange={(e) => setFilterDate(new Date(e.target.value))}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Lecture List */}
        <div className="w-full md:w-[55%] border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
          {filteredLectures.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">No lectures found for this date</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Try changing the date or filters</p>
            </div>
          ) : (
            filteredLectures.map((lecture) => (
              <div 
                key={lecture.id}
                onClick={() => handleSelectLecture(lecture)}
                className={`border-b border-gray-200 dark:border-gray-800 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  selectedLecture?.id === lecture.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{lecture.courseName}</h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{lecture.courseCode}</p>
                    
                    <div className="mt-2 flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      <span>{lecture.startTime} - {lecture.endTime}</span>
                      
                      <span className="mx-2 text-gray-300 dark:text-gray-700">|</span>
                      
                      <Users className="h-3.5 w-3.5 mr-1.5" />
                      <span>{lecture.studentsPresent}/{lecture.totalStudents} Present</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full
                      ${lecture.attendancePercentage >= 90 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : lecture.attendancePercentage >= 75 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }
                    `}>
                      {lecture.attendancePercentage}% Attendance
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{lecture.location}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Attendance Details */}
        <div className="w-full md:w-[45%] overflow-y-auto">
          {selectedLecture ? (
            <div className="p-4">
              {/* Header */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{selectedLecture.courseName}</h2>
                <p className="text-sm text-blue-600 dark:text-blue-400">{selectedLecture.courseCode}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {format(parseISO(selectedLecture.date), 'EEEE, MMMM d, yyyy')}
                </p>
                
                <div className="mt-3 flex items-center text-sm">
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md flex items-center mr-2">
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs font-medium">{selectedLecture.studentsPresent}/{selectedLecture.totalStudents}</span>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-md flex items-center text-xs font-medium
                    ${selectedLecture.attendancePercentage >= 90 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                      : selectedLecture.attendancePercentage >= 75 
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }
                  `}>
                    <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                    <span>{selectedLecture.attendancePercentage}% Attendance</span>
                  </div>
                </div>
              </div>
              
              {/* Schedule Info */}
              <div className="py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">Time</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLecture.startTime} - {selectedLecture.endTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">Location</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLecture.location}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div className="py-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Lecture Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedLecture.notes}
                </p>
              </div>
              
              {/* Attendance List */}
              <div className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Attendance List</h3>
                  <button 
                    onClick={handleDownloadAttendance}
                    disabled={isExporting}
                    className="text-xs text-blue-600 dark:text-blue-400 flex items-center hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {isExporting ? (
                      <>
                        <div className="h-3 w-3 border-t-2 border-r-2 border-blue-600 dark:border-blue-400 rounded-full animate-spin mr-1.5" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Export CSV
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-2 border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="py-2 px-3 text-left font-medium">#</th>
                        <th className="py-2 px-3 text-left font-medium">Student</th>
                        <th className="py-2 px-3 text-left font-medium">Status</th>
                        <th className="py-2 px-3 text-left font-medium">Time In</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {selectedLecture.attendance.slice(0, 10).map((student, idx) => (
                        <tr key={student.id} className="bg-white dark:bg-gray-900">
                          <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center">
                              <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 flex items-center justify-center text-[10px] font-medium mr-2">
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-gray-900 dark:text-white">{student.name}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            {student.present ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                <Check className="h-3 w-3 mr-1" />
                                Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                <X className="h-3 w-3 mr-1" />
                                Absent
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                            {student.timein || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Show limited entries with count */}
                  {selectedLecture.attendance.length > 10 && (
                    <div className="py-2 px-3 text-center bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                      Showing 10 of {selectedLecture.attendance.length} students. 
                      <button 
                        onClick={handleDownloadAttendance}
                        className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Export to view all
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div>
                <Calendar className="h-16 w-16 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Select a lecture to view attendance details</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-2 max-w-sm">
                  Track lecture attendance, view student records, and manage class statistics
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LectureHistoryView; 