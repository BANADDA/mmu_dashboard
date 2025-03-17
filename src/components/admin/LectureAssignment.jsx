import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import {
    AlertTriangle,
    BookOpen,
    Calendar,
    Check,
    Filter,
    Loader2,
    Search,
    User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';

const LectureAssignment = () => {
  // State for lectures and users
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [lectures, setLectures] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  
  // Status states
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load courses and lecturers on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDepartments(),
        fetchLecturers()
        // Don't fetch lectures initially without a course ID
      ]);
      setLoading(false);
    };
    
    fetchInitialData();
  }, []);
  
  // Load lectures when a course is selected
  useEffect(() => {
    if (selectedCourse && selectedCourse !== 'all') {
      console.log(`Loading lectures for course ID: ${selectedCourse}`);
      fetchLectures(selectedCourse);
    } else {
      // If no course selected or "All Courses" selected, fetch all lectures
      console.log('Loading all lectures');
      fetchAllLectures();
    }
  }, [selectedCourse]);
  
  // Load courses when department is selected
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      try {
        if (selectedDepartment === 'all') {
          await fetchCourses();
        } else {
          await fetchCoursesByDepartment(selectedDepartment);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
        setErrorMessage('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    
    loadCourses();
  }, [selectedDepartment]);
  
  // Fetch all active courses
  const fetchCourses = async () => {
    try {
      // Don't filter by active status
      const coursesQuery = query(
        collection(db, 'courses')
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      console.log(`Retrieved ${coursesSnapshot.docs.length} total courses`);
      
      const coursesData = [];
      
      for (const courseDoc of coursesSnapshot.docs) {
        const courseData = {
          id: courseDoc.id,
          ...courseDoc.data(),
          departmentName: ''
        };
        
        // Get department name
        if (courseData.departmentId) {
          const departmentDoc = await getDoc(doc(db, 'departments', courseData.departmentId));
          if (departmentDoc.exists()) {
            courseData.departmentName = departmentDoc.data().name;
          }
        }
        
        coursesData.push(courseData);
      }
      
      // Sort courses by name client-side instead
      coursesData.sort((a, b) => a.name?.localeCompare(b.name) || 0);
      
      console.log('All courses:', coursesData);
      setCourses(coursesData);
      return coursesData;
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  };
  
  // Fetch all lecturers from Firestore
  const fetchLecturers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'lecturer')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const lecturersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setLecturers(lecturersData);
      return lecturersData;
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      return [];
    }
  };
  
  // Fetch lectures for a specific course
  const fetchLectures = async (courseId) => {
    try {
      if (!courseId) {
        // If no courseId provided, just set empty lectures
        setLectures([]);
        return;
      }

      console.log(`Fetching lectures for course ID: ${courseId}`);
      const lecturesQuery = query(
        collection(db, 'lectures'),
        where('courseId', '==', courseId)
      );
      
      const lecturesSnapshot = await getDocs(lecturesQuery);
      console.log(`Retrieved ${lecturesSnapshot.docs.length} lectures for course ${courseId}`);
      
      // Process lecture data
      const lecturesData = [];
      
      for (const lectureDoc of lecturesSnapshot.docs) {
        const lectureData = {
          id: lectureDoc.id,
          ...lectureDoc.data(),
          lecturerName: ''
        };
        
        // Add lecturer name
        if (lectureData.lecturerId) {
          const lecturerDoc = await getDoc(doc(db, 'users', lectureData.lecturerId));
          if (lecturerDoc.exists()) {
            const lecturer = lecturerDoc.data();
            lectureData.lecturerName = lecturer.displayName || lecturer.email;
          }
        }
        
        // Add course details
        const selectedCourseObj = courses.find(c => c.id === courseId);
        if (selectedCourseObj) {
          lectureData.course = selectedCourseObj;
        }
        
        lecturesData.push(lectureData);
      }
      
      // Sort lectures by date
      lecturesData.sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
      
      console.log('Processed lectures data:', lecturesData);
      setLectures(lecturesData);
    } catch (error) {
      console.error('Error fetching lectures:', error);
      setLectures([]);
    }
  };
  
  // Fetch all lectures
  const fetchAllLectures = async () => {
    try {
      console.log('Fetching all lectures');
      const lecturesQuery = query(
        collection(db, 'lectures')
      );
      
      const lecturesSnapshot = await getDocs(lecturesQuery);
      console.log(`Retrieved ${lecturesSnapshot.docs.length} total lectures`);
      
      // Process lecture data
      const lecturesData = [];
      
      for (const lectureDoc of lecturesSnapshot.docs) {
        const lectureData = {
          id: lectureDoc.id,
          ...lectureDoc.data(),
          lecturerName: ''
        };
        
        // Add lecturer name
        if (lectureData.lecturerId) {
          const lecturerDoc = await getDoc(doc(db, 'users', lectureData.lecturerId));
          if (lecturerDoc.exists()) {
            const lecturer = lecturerDoc.data();
            lectureData.lecturerName = lecturer.displayName || lecturer.email;
          }
        }
        
        // Add course details if available
        if (lectureData.courseId) {
          const courseDoc = await getDoc(doc(db, 'courses', lectureData.courseId));
          if (courseDoc.exists()) {
            lectureData.course = {
              id: courseDoc.id,
              ...courseDoc.data()
            };
            
            // Add department name if department exists
            if (lectureData.course.departmentId) {
              const deptDoc = await getDoc(doc(db, 'departments', lectureData.course.departmentId));
              if (deptDoc.exists()) {
                lectureData.course.departmentName = deptDoc.data().name;
              }
            }
          }
        }
        
        lecturesData.push(lectureData);
      }
      
      // Sort lectures by date
      lecturesData.sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });
      
      console.log('Processed all lectures data:', lecturesData);
      setLectures(lecturesData);
    } catch (error) {
      console.error('Error fetching all lectures:', error);
      setLectures([]);
    }
  };
  
  // Handle lecturer assignment
  const assignLecturer = async (lectureId, lecturerId) => {
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const lectureRef = doc(db, 'lectures', lectureId);
      await updateDoc(lectureRef, {
        lecturerId: lecturerId,
        updatedAt: new Date()
      });
      
      // Update local state
      setLectures(prevLectures => 
        prevLectures.map(lecture => 
          lecture.id === lectureId 
            ? { 
                ...lecture, 
                lecturerId: lecturerId,
                lecturer: lecturers.find(l => l.id === lecturerId) || null
              } 
            : lecture
        )
      );
      
      setSuccessMessage(`Lecturer assigned successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error assigning lecturer:", error);
      setErrorMessage("Failed to assign lecturer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle department filter change
  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setSelectedCourse(''); // Reset course selection when department changes
  };
  
  // Handle course filter change
  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Filtered lectures based on search query
  const filteredLectures = lectures.filter(lecture => {
    const searchString = searchQuery.toLowerCase();
    return (
      lecture.title.toLowerCase().includes(searchString) ||
      lecture.lecturerName.toLowerCase().includes(searchString) ||
      (lecture.topics && lecture.topics.some(topic => 
        topic.toLowerCase().includes(searchString)
      ))
    );
  });
  
  // Fetch departments
  const fetchDepartments = async () => {
    try {
      // Don't filter by active field to ensure we get data
      const departmentsQuery = query(
        collection(db, 'departments')
      );
      
      const snapshot = await getDocs(departmentsQuery);
      console.log(`Retrieved ${snapshot.docs.length} departments`);
      
      const departmentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort departments by name client-side instead
      departmentsList.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log('Departments:', departmentsList);
      setDepartments(departmentsList);
      return departmentsList;
    } catch (error) {
      console.error("Error fetching departments:", error);
      setErrorMessage("Failed to load departments");
      return [];
    }
  };
  
  // Fetch courses by department
  const fetchCoursesByDepartment = async (departmentId) => {
    try {
      console.log(`Fetching courses for department: ${departmentId}`);
      
      // Only filter by departmentId, not by active status
      const coursesQuery = query(
        collection(db, 'courses'),
        where('departmentId', '==', departmentId)
      );
      
      const snapshot = await getDocs(coursesQuery);
      console.log(`Retrieved ${snapshot.docs.length} courses for department ${departmentId}`);
      
      const coursesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort courses by name client-side instead
      coursesList.sort((a, b) => a.name?.localeCompare(b.name) || 0);
      
      console.log('Courses by department:', coursesList);
      setCourses(coursesList);
      return coursesList;
    } catch (error) {
      console.error(`Error fetching courses for department ${departmentId}:`, error);
      setErrorMessage("Failed to load courses for the selected department");
      return [];
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Lecture Assignment</h1>
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Department Filter */}
          <div className="md:w-1/4">
            <label htmlFor="department-filter" className="sr-only">Filter by Department</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <select
                id="department-filter"
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Departments</option>
                {departments.length > 0 ? (
                  departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No departments found</option>
                )}
              </select>
            </div>
          </div>
          
          {/* Course Filter */}
          <div className="md:w-1/4">
            <label htmlFor="course-filter" className="sr-only">Filter by Course</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <BookOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <select
                id="course-filter"
                value={selectedCourse}
                onChange={handleCourseChange}
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Courses</option>
                {courses.length > 0 ? (
                  courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name || 'Unnamed Course'} {course.code ? `(${course.code})` : ''}
                    </option>
                  ))
                ) : (
                  <option disabled>No courses found</option>
                )}
              </select>
            </div>
          </div>
          
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="lecture-search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="text"
                id="lecture-search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search lectures by title, course, or lecturer..."
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>
      
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-300">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Loading lectures...</span>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {filteredLectures.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No lectures found</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {lectures.length === 0 
                  ? "There are no lectures in the system yet."
                  : "No lectures match your current filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lecture
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Current Lecturer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Assign To
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLectures.map(lecture => (
                    <tr key={lecture.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{formatDate(lecture.date)}</div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {lecture.startTime} - {lecture.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{lecture.course?.name || 'Unknown Course'}</div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {lecture.course?.code || 'No code'} • {lecture.course?.departmentName || 'Unknown Dept'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{lecture.title || 'Untitled Lecture'}</div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {lecture.location ? `Location: ${lecture.location}` : 'No location set'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {lecture.lecturerId ? (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <span>
                              {lecturers.find(l => l.id === lecture.lecturerId)?.displayName || 'Unknown Lecturer'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 italic">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <select
                            value={lecture.lecturerId || ''}
                            onChange={(e) => assignLecturer(lecture.id, e.target.value)}
                            disabled={isSubmitting}
                            className="block w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                          >
                            <option value="">-- Select Lecturer --</option>
                            {lecturers.map(lecturer => (
                              <option key={lecturer.id} value={lecturer.id}>
                                {lecturer.displayName}
                              </option>
                            ))}
                          </select>
                          {isSubmitting && (
                            <Loader2 className="ml-2 h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LectureAssignment; 