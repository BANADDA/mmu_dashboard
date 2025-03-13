import { Building2, ChevronRight, Plus, Search, Users } from 'lucide-react';
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
    <div className="flex max-w-full flex-col h-full bg-gray-950">
      {/* Header with filters */}
      <div className="p-4 pb-2">
        {/* Filters Row */}
        <div className="flex items-center gap-2">
          {/* Department Filter */}
          <div className="w-56">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-sm rounded-md border border-gray-800 bg-gray-900 text-gray-300 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses or lecturers..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-md border border-gray-800 bg-gray-900 text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Add Course Button */}
          <button className="p-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Course List */}
        <div className="w-[65%] border-r border-gray-800">
          <div className="h-full overflow-y-auto">
            {filteredCourses.map((course) => (
              <div 
                key={course.id} 
                className={`flex items-center border-b border-gray-800 cursor-pointer hover:bg-gray-900/50 ${
                  selectedCourse?.id === course.id ? 'bg-gray-900' : ''
                }`}
                onClick={() => handleCourseClick(course)}
              >
                {/* Course title and code */}
                <div className="flex-1 p-3">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-medium text-white">{course.title}</h3>
                    <p className="text-xs text-blue-400">{course.code}</p>
                  </div>
                </div>

                {/* Department */}
                <div className="w-48 p-3 flex items-center text-gray-400">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span className="text-xs">{course.department}</span>
                </div>

                {/* Lecturer */}
                <div className="w-48 p-3 flex items-center text-gray-400">
                  <Users className="h-4 w-4 mr-2" />
                  <span className="text-xs">{course.lecturer}</span>
                </div>

                {/* Credits */}
                <div className="w-24 p-3 flex items-center text-gray-400">
                  <span className="text-xs">{course.credits} Credits</span>
                </div>

                {/* Students */}
                <div className="w-24 p-3 flex items-center text-gray-400">
                  <span className="text-xs">{course.students} Students</span>
                </div>

                <div className="px-4">
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Course Details Panel */}
        <div className="w-[50%] bg-gray-900">
          <div className="h-full flex items-center justify-center text-center text-gray-400">
            <div>
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a course to view details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesView; 