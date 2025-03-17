import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import {
    AlertTriangle,
    BookOpen,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    FileText,
    Filter,
    Layers,
    Loader2,
    MapPin,
    Search,
    Share2,
    Tag,
    UserRound
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import LocationManager from './LocationManager';
import ScheduleForm from './ScheduleForm';
import TopicsManager from './TopicsManager';

const CoursesView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering and selection state
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  
  // UI state
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Data state
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  
  // UI state
  const [isTopicsManagerOpen, setIsTopicsManagerOpen] = useState(false);
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  
  // Auto-hide sidebar when a course is selected on mobile/medium screens
  useEffect(() => {
    if (selectedCourse && window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  }, [selectedCourse]);
  
  // Fetch departments on component mount with real-time updates
  useEffect(() => {
    setError('');
    
    const departmentsQuery = query(
      collection(db, 'departments'),
      orderBy('name')
    );
    
    const unsubscribe = onSnapshot(
      departmentsQuery, 
      (snapshot) => {
        const departmentsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched departments:', departmentsList);
        setDepartments(departmentsList);
        
        if (departmentsList.length === 0) {
          console.warn('No departments found in the database');
          // Instead of showing an error, we'll just log a warning and continue
          // The UI will show "No departments found" in the dropdown
        }
      },
      (err) => {
        console.error('Error fetching departments:', err);
        setError('Failed to load departments');
      }
    );
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);
  
  // Fetch lecturer lectures when departments are loaded or user changes
  useEffect(() => {
    if (user?.uid) {
      fetchLecturerLectures();
    }
  }, [user]);
  
  // Fetch lectures assigned to the current lecturer
  const fetchLecturerLectures = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Get all lectures assigned to this lecturer
      const lecturesQuery = query(
        collection(db, 'lectures'),
        where('lecturerId', '==', user.uid)
      );
      
      const lecturesSnapshot = await getDocs(lecturesQuery);
      
      // Organize lectures by course
      const uniqueCourseIds = new Set();
      const lecturesData = [];
      
      for (const lectureDoc of lecturesSnapshot.docs) {
        const lectureData = {
          id: lectureDoc.id,
          ...lectureDoc.data()
        };
        
        // Add to lecture list
        lecturesData.push(lectureData);
        
        // Track unique course IDs
        if (lectureData.courseId) {
          uniqueCourseIds.add(lectureData.courseId);
        }
      }
      
      console.log('Found lectures:', lecturesData);
      setLectures(lecturesData);
      
      // Fetch course details for each unique course
      const courseIds = Array.from(uniqueCourseIds);
      
      if (courseIds.length === 0) {
        setLoading(false);
        setCourses([]);
        return;
      }
      
      const coursesData = [];
      
      for (const courseId of courseIds) {
        try {
          const courseDoc = await getDoc(doc(db, 'courses', courseId));
          
          if (courseDoc.exists()) {
            const courseData = {
              id: courseDoc.id,
              ...courseDoc.data(),
              departmentName: '',
              studentCount: 0,
              lectureCount: lecturesData.filter(lecture => lecture.courseId === courseId).length,
              // Get topics from all lectures for this course
              topics: lecturesData
                .filter(lecture => lecture.courseId === courseId)
                .flatMap(lecture => lecture.topics || [])
                .filter((topic, index, self) => topic && self.indexOf(topic) === index), // Deduplicate
              students: []
            };
            
            // Get department name
            if (courseData.departmentId) {
              try {
                const departmentDoc = await getDoc(doc(db, 'departments', courseData.departmentId));
                if (departmentDoc.exists()) {
                  courseData.departmentName = departmentDoc.data().name;
                }
              } catch (deptError) {
                console.error('Error fetching department:', deptError);
              }
            }
            
            // Get student count - students registered for the course
            try {
              const studentsQuery = query(
                collection(db, 'students'),
                where('courseId', '==', courseId)
              );
              const studentsSnapshot = await getDocs(studentsQuery);
              courseData.studentCount = studentsSnapshot.size;
              
              // Store student data for viewing later
              courseData.students = studentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            } catch (studentsError) {
              console.error('Error fetching student count:', studentsError);
              courseData.studentCount = 0;
              courseData.students = [];
            }
            
            coursesData.push(courseData);
          }
        } catch (courseError) {
          console.error(`Error fetching course ${courseId}:`, courseError);
        }
      }
      
      console.log('Fetched courses from lectures:', coursesData);
      setCourses(coursesData);
      
      // If there's only one course, select it automatically
      if (coursesData.length === 1) {
        setSelectedCourse(coursesData[0]);
      }
    } catch (error) {
      console.error('Error fetching lecturer lectures:', error);
      setError('Failed to load your courses and lectures');
    } finally {
      setLoading(false);
    }
  };
  
  // Get lectures for selected course
  const getCourseLectures = (courseId) => {
    return lectures.filter(lecture => lecture.courseId === courseId)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
  };
  
  // Filter courses based on department and search query
  const filteredCourses = courses.filter(course => {
    const matchesDepartment = selectedDepartment === 'all' || course.departmentId === selectedDepartment;
    
    const matchesSearch = course.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (course.topics && course.topics.some(topic => 
                            topic.toLowerCase().includes(searchQuery.toLowerCase())
                          ));
    
    return matchesDepartment && matchesSearch;
  });

  // Handle department filter change
  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle course selection
  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setSelectedLecture(null);
  };
  
  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };
  
  // Open topics manager for a specific lecture
  const handleManageTopics = (lecture) => {
    if (!lecture) return;
    setSelectedLecture(lecture);
    setIsTopicsManagerOpen(true);
  };
  
  // Open location manager
  const handleManageLocation = () => {
    if (!selectedCourse) return;
    setIsLocationManagerOpen(true);
  };
  
  // Open schedule form
  const handleScheduleLecture = () => {
    if (!selectedCourse) return;
    setIsScheduleFormOpen(true);
  };
  
  // Handle topics update for a lecture
  const handleTopicsUpdated = (updatedTopics) => {
    if (!selectedLecture) return;
    
    // Update local state for lectures
    const updatedLectures = lectures.map(lecture => 
      lecture.id === selectedLecture.id 
        ? { ...lecture, topics: updatedTopics } 
        : lecture
    );
    
    setLectures(updatedLectures);
    
    // Update the aggregated topics at the course level as well
    if (selectedCourse) {
      const courseLectures = updatedLectures.filter(lecture => 
        lecture.courseId === selectedCourse.id
      );
      
      const courseTopics = courseLectures
        .flatMap(lecture => lecture.topics || [])
        .filter((topic, index, self) => topic && self.indexOf(topic) === index);
      
      const updatedCourses = courses.map(course => 
        course.id === selectedCourse.id 
          ? { ...course, topics: courseTopics } 
          : course
      );
      
      setCourses(updatedCourses);
      setSelectedCourse(prevCourse => ({
        ...prevCourse,
        topics: courseTopics
      }));
    }
  };
  
  // Handle location update
  const handleLocationUpdated = (updatedLocation) => {
    if (!selectedCourse) return;
    
    // Update local state
    const updatedCourses = courses.map(course => 
      course.id === selectedCourse.id 
        ? { ...course, location: updatedLocation } 
        : course
    );
    
    setCourses(updatedCourses);
    setSelectedCourse({ ...selectedCourse, location: updatedLocation });
  };
  
  // Handle schedule added
  const handleScheduleAdded = (newLecture) => {
    if (!selectedCourse) return;
    
    // Add new lecture to the lectures array
    setLectures(prevLectures => [...prevLectures, newLecture]);
    
    // If the lecture has topics, update the course topics as well
    if (newLecture.topics && newLecture.topics.length > 0) {
      const courseLectures = [...lectures, newLecture].filter(
        lecture => lecture.courseId === selectedCourse.id
      );
      
      const courseTopics = courseLectures
        .flatMap(lecture => lecture.topics || [])
        .filter((topic, index, self) => topic && self.indexOf(topic) === index);
      
      const updatedCourses = courses.map(course => 
        course.id === selectedCourse.id 
          ? { ...course, topics: courseTopics } 
          : course
      );
      
      setCourses(updatedCourses);
      setSelectedCourse(prevCourse => ({
        ...prevCourse,
        topics: courseTopics
      }));
    }

    // Update lecture count for this course
    if (selectedCourse) {
      setSelectedCourse(prevCourse => ({
        ...prevCourse,
        lectureCount: (prevCourse.lectureCount || 0) + 1
      }));
    }
  };

  // Format date for nice display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden relative">
      <div className="bg-white dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Your Courses</h1>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Department Filter */}
          <div className="sm:w-1/3">
            <label htmlFor="department-filter" className="sr-only">Filter by Department</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Filter className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              </div>
            <select
                id="department-filter"
              value={selectedDepartment}
                onChange={handleDepartmentChange}
                className="block w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Departments</option>
                {departments.length > 0 ? (
                  departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name || 'Unnamed Department'}
                    </option>
                  ))
                ) : (
                  <option disabled value="">No departments found</option>
                )}
            </select>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label htmlFor="course-search" className="sr-only">Search Courses</label>
            <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-3 h-3 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
                id="course-search"
              value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search courses by name, code, or topic..."
                className="block w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
          <button 
            onClick={() => {
              setError('');
              setLoading(true);
              const departmentsQuery = query(collection(db, 'departments'), orderBy('name'));
              onSnapshot(
                departmentsQuery, 
                (snapshot) => {
                  const departmentsList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  }));
                  console.log('Refreshed departments:', departmentsList);
                  setDepartments(departmentsList);
                  setLoading(false);
                },
                (err) => {
                  console.error('Error refreshing departments:', err);
                  setError('Failed to load departments. Please try again.');
                  setLoading(false);
                }
              );
            }}
            className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Retry
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">Loading your courses...</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row overflow-auto relative">
          {/* Course List Sidebar */}
          {showSidebar && (
            <div className="w-full md:w-2/5 lg:w-1/4 overflow-y-auto border-r border-gray-200 dark:border-gray-700">
              {filteredCourses.length === 0 ? (
                <div className="p-4 text-center">
                  <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">No courses found</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {courses.length === 0 
                      ? "You don't have any lectures assigned to you yet."
                      : "No courses match your current filters."}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCourses.map(course => (
                    <li 
                key={course.id} 
                onClick={() => handleCourseClick(course)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors
                        ${selectedCourse?.id === course.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600' 
                          : ''}`}
                    >
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {course.name}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-mono">{course.code}</span>
                        <span className="mx-2">•</span>
                        <span>{course.departmentName}</span>
                      </div>
                      {course.topics && course.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {course.topics.slice(0, 3).map(topic => (
                            <span 
                              key={topic}
                              className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300"
                            >
                              <Tag className="h-2 w-2 mr-1" />
                              {topic}
                            </span>
                          ))}
                          {course.topics.length > 3 && (
                            <span className="inline-flex items-center bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                              +{course.topics.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                          {course.studentCount} {course.studentCount === 1 ? 'student' : 'students'}
                        </div>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                          <Calendar className="h-2.5 w-2.5 mr-1" />
                          {course.lectureCount || getCourseLectures(course.id).length} {course.lectureCount === 1 ? 'lecture' : 'lectures'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* Toggle sidebar button */}
          <button 
            onClick={toggleSidebar}
            className="absolute top-4 left-0 transform translate-x-0 md:translate-x-0 z-10 bg-blue-600 text-white p-1.5 rounded-r-md shadow-md"
            style={{ 
              left: showSidebar ? 'calc(100% * 0.25 - 1px)' : '0',
              transition: 'left 0.3s ease-in-out'
            }}
          >
            {showSidebar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {/* Course Details */}
          <div className={`flex-1 overflow-y-auto p-0 transition-all duration-300 ${!showSidebar ? 'w-full' : ''}`}>
            {selectedCourse ? (
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap justify-between items-start">
                    <div>
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {selectedCourse.code} • {selectedCourse.departmentName}
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                        {selectedCourse.name}
                      </h2>
                      
                      {selectedCourse.location && (
                        <div className="flex items-center mt-1 text-xs text-gray-600 dark:text-gray-300">
                          <MapPin className="h-3 w-3 mr-1" />
                          {selectedCourse.location}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <button
                        onClick={handleScheduleLecture}
                        className="flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                      >
                        <Calendar className="h-3 w-3 mr-1" />
                        Schedule Lecture
                      </button>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    <button
                      onClick={handleManageLocation}
                      className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Set Location
                    </button>
                    
                    <button
                      className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Attendance
                    </button>
                    
                    <button
                      className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </button>
                    
                    <button
                      className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="grid md:grid-cols-3 gap-4 p-4">
                    {/* Description */}
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        <FileText className="h-4 w-4 inline mr-1 text-gray-600 dark:text-gray-400" />
                        Description
                      </h3>
                      <div className="prose dark:prose-invert prose-xs max-w-none text-xs text-gray-600 dark:text-gray-300">
                        {selectedCourse.description || (
                          <p className="italic text-xs text-gray-500 dark:text-gray-400">
                            No description available
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Course Topics (aggregated from lectures) */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        <Layers className="h-4 w-4 inline mr-1 text-gray-600 dark:text-gray-400" />
                        Course Topics
                      </h3>
                      
                      {selectedCourse.topics && selectedCourse.topics.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedCourse.topics.map(topic => (
                            <div 
                              key={topic}
                              className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
                            >
                              <Tag className="h-2 w-2 mr-1" />
                              {topic}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="italic text-xs text-gray-500 dark:text-gray-400">
                          No topics defined. Add topics to your lectures to help students understand what this course covers.
                        </p>
                      )}
                    </div>
                    
                    {/* Upcoming Lectures */}
                    <div className="md:col-span-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        <Calendar className="h-4 w-4 inline mr-1 text-gray-600 dark:text-gray-400" />
                        Your Lectures
                      </h3>
                      
                      {getCourseLectures(selectedCourse.id).length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Title
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Date
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Time
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Location
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Topics
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {getCourseLectures(selectedCourse.id).map(lecture => (
                                <tr key={lecture.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                                    {lecture.title || 'Untitled Lecture'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(lecture.date)}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                    {lecture.startTime} - {lecture.endTime}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                    {lecture.location || (selectedCourse.location || 'Not specified')}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-wrap gap-1">
                                      {lecture.topics && lecture.topics.length > 0 ? (
                                        lecture.topics.slice(0, 2).map(topic => (
                                          <span 
                                            key={topic}
                                            className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
                                          >
                                            <Tag className="h-2 w-2 mr-0.5" />
                                            {topic}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-xs italic">No topics</span>
                                      )}
                                      {lecture.topics && lecture.topics.length > 2 && (
                                        <span className="text-xs">+{lecture.topics.length - 2}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation(); // Prevent course selection
                                        handleManageTopics(lecture);
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                      Manage Topics
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="italic text-xs text-gray-500 dark:text-gray-400">
                          No lectures scheduled yet. Click the "Schedule Lecture" button to add one.
                        </p>
                      )}
                      
                      <button
                        onClick={handleScheduleLecture}
                        className="mt-2 flex items-center px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <Calendar className="h-2.5 w-2.5 mr-1" />
                        Schedule New Lecture
                      </button>
                    </div>
                    
                    {/* Course Stats */}
                    <div className="md:col-span-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Course Statistics
                      </h3>
                      
                      <div className="bg-gray-50 dark:bg-gray-700/30 rounded-md p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Enrolled Students:</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{selectedCourse.studentCount}</span>
                </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Scheduled Lectures:</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{getCourseLectures(selectedCourse.id).length}</span>
                </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Topics:</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{selectedCourse.topics?.length || 0}</span>
                </div>

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Department:</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{selectedCourse.departmentName}</span>
                        </div>
                      </div>
                </div>

                    {/* Enrolled Students */}
                    <div className="md:col-span-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        <UserRound className="h-4 w-4 inline mr-1 text-gray-600 dark:text-gray-400" />
                        Enrolled Students
                      </h3>
                      
                      {selectedCourse?.students && selectedCourse.students.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                              <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  ID
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Name
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Email
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Enrollment Date
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {selectedCourse.students.map(student => (
                                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900 dark:text-white">
                                    {student.studentId || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                    {student.name || 'Unnamed Student'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                    {student.email || 'No email'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                                    {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="italic text-xs text-gray-500 dark:text-gray-400">
                          No students enrolled in this course yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-4">
                <BookOpen className="w-12 h-12 text-gray-400 mb-3" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {showSidebar ? "Select a course to view details" : "No course selected"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-md">
                  {showSidebar 
                    ? "Choose a course from the list to view its details, manage your lecture topics, set locations, and schedule lectures."
                    : "Click the arrow button to show the course list and select a course to view."
                  }
                </p>
                {!showSidebar && (
                  <button
                    onClick={toggleSidebar}
                    className="mt-4 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    Show Course List
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modals */}
      {isTopicsManagerOpen && selectedLecture && (
        <div className="fixed inset-0 z-50">
          <TopicsManager 
            lecture={selectedLecture}
            onClose={() => setIsTopicsManagerOpen(false)}
            onTopicsUpdated={handleTopicsUpdated}
          />
            </div>
      )}
      
      {isLocationManagerOpen && selectedCourse && (
        <div className="fixed inset-0 z-50">
          <LocationManager 
            course={selectedCourse}
            onClose={() => setIsLocationManagerOpen(false)}
            onLocationUpdated={handleLocationUpdated}
          />
          </div>
      )}
      
      {isScheduleFormOpen && selectedCourse && (
        <div className="fixed inset-0 z-50">
          <ScheduleForm 
            course={selectedCourse}
            onClose={() => setIsScheduleFormOpen(false)}
            onScheduleAdded={handleScheduleAdded}
          />
        </div>
      )}
    </div>
  );
};

export default CoursesView; 