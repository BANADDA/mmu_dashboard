import { BookOpen, Building2, ChevronRight, Clock, GraduationCap, Plus, Search, Users, X } from 'lucide-react';
import { useState } from 'react';

const CoursesView = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const departments = [
    { id: 'all', name: 'All Departments' },
    { id: 'cs', name: 'Computer Science' },
    { id: 'ee', name: 'Electrical Engineering' },
    { id: 'bus', name: 'Business School' }
  ];

  const [courses] = useState([
    {
      id: 1,
      title: 'Software Engineering',
      code: 'CSC 301',
      department: 'Computer Science',
      departmentId: 'cs',
      lecturer: 'Dr. John Smith',
      students: 45,
      credits: 3
    },
    {
      id: 2,
      title: 'Database Systems',
      code: 'CSC 302',
      department: 'Computer Science',
      departmentId: 'cs',
      lecturer: 'Prof. Sarah Johnson',
      students: 38,
      credits: 4
    },
    {
      id: 3,
      title: 'Digital Electronics',
      code: 'ELE 201',
      department: 'Electrical Engineering',
      departmentId: 'ee',
      lecturer: 'Dr. Michael Chen',
      students: 52,
      credits: 3
    },
    {
      id: 4,
      title: 'Business Analytics',
      code: 'BUS 401',
      department: 'Business School',
      departmentId: 'bus',
      lecturer: 'Prof. Emily Brown',
      students: 63,
      credits: 3
    }
  ]);

  const filteredCourses = courses.filter(course => {
    const matchesDepartment = selectedDepartment === 'all' || course.departmentId === selectedDepartment;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.lecturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDepartment && matchesSearch;
  });

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="p-3 pb-0">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Course List</h1>
        
        {/* Filters Row */}
        <div className="flex flex-wrap gap-2 items-center mb-3">
          {/* Department Filter */}
          <div className="flex-1 min-w-[180px]">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="flex-1 min-w-[180px] relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <Search className="h-3 w-3 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses or lecturers..."
              className="w-full pl-6 pr-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Add Course Button */}
          <button className="p-1 rounded-md bg-blue-500 text-white shadow-sm hover:bg-blue-600 transition-colors">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Course List - Now with fixed width and scrollable */}
        <div className="w-3/4 p-3 pt-0 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {filteredCourses.map((course) => (
              <div 
                key={course.id} 
                className={`bg-white dark:bg-gray-800 rounded-md shadow-sm overflow-hidden transition-all hover:shadow-md border border-gray-100 dark:border-gray-700 flex items-center cursor-pointer ${
                  selectedCourse?.id === course.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleCourseClick(course)}
              >
                {/* Left blue accent bar */}
                <div className="w-1 self-stretch bg-blue-500"></div>
                
                {/* Course code and title */}
                <div className="px-3 py-2 border-r border-gray-100 dark:border-gray-700 w-1/3">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[150px]">{course.title}</p>
                  <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">{course.code}</p>
                </div>
                
                {/* Department and lecturer */}
                <div className="px-3 py-2 flex flex-col justify-center w-1/3">
                  <div className="flex items-center space-x-1">
                    <Building2 className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{course.department}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                    <p className="text-[10px] text-gray-600 dark:text-gray-300 truncate">{course.lecturer}</p>
                  </div>
                </div>
                
                {/* Credits and students */}
                <div className="px-3 py-2 flex flex-col justify-center w-1/3">
                  <div className="flex items-center space-x-1">
                    <BookOpen className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{course.credits} Credits</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="inline-block w-2.5 h-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-blue-600 dark:text-blue-400">{course.students}</span>
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Students</p>
                  </div>
                </div>

                <div className="px-2">
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Course Details Panel */}
        <div className="w-1/4 p-4 bg-white dark:bg-gray-800 overflow-y-auto">
          {selectedCourse ? (
            <div className="space-y-4">
              {/* Header with close button */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCourse.title}</h2>
                  <p className="text-sm text-blue-500 dark:text-blue-400">{selectedCourse.code}</p>
                </div>
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* Course Details */}
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Lecturer</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedCourse.lecturer}</p>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Department</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{selectedCourse.department}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Students</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedCourse.students}</p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Credits</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{selectedCourse.credits}</p>
                  </div>
                </div>

                {/* Additional course details can be added here */}
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Course Description</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This is a comprehensive course covering various aspects of {selectedCourse.title.toLowerCase()}. 
                    Students will learn theoretical concepts and practical applications in the field.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
              <Building2 className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Select a course to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursesView; 