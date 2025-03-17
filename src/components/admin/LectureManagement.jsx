import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { AlertCircle, BookPlus, Edit, Loader2, Plus, Search, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { USER_ROLES } from '../../firebase/auth';
import { db } from '../../firebase/config';

const LectureManagement = () => {
  // State for lecture list
  const [lectures, setLectures] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // State for lecture form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentLecture, setCurrentLecture] = useState({
    title: '',
    courseId: '',
    lecturerId: '',
    semester: 1,
    creditUnits: 3,
    description: '',
    durationMonths: 3, // Default to 3 months
    isActive: true
  });
  
  // State for quick course creation
  const [showQuickCourseForm, setShowQuickCourseForm] = useState(false);
  const [quickCourse, setQuickCourse] = useState({
    name: '',
    code: '',
    years: 3 // Default to 3 years
  });
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  
  // State for operations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      console.log('LectureManagement: Fetching departments...');
      const departmentsQuery = query(collection(db, 'departments'), orderBy('name'));
      const querySnapshot = await getDocs(departmentsQuery);
      
      const fetchedDepartments = [];
      querySnapshot.forEach((doc) => {
        fetchedDepartments.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('LectureManagement: Fetched departments:', fetchedDepartments);
      setDepartments(fetchedDepartments);
      
      // Select first department by default if none selected
      if (fetchedDepartments.length > 0 && !selectedDepartment) {
        console.log('LectureManagement: Setting default department:', fetchedDepartments[0].id);
        setSelectedDepartment(fetchedDepartments[0].id);
      }
    } catch (error) {
      console.error('LectureManagement: Error fetching departments:', error);
      setError('Failed to load departments. Please try again later.');
    }
  };
  
  // Fetch courses by department
  const fetchCourses = async () => {
    try {
      console.log('LectureManagement: Fetching courses for department:', selectedDepartment);
      let coursesQuery;
      
      if (selectedDepartment) {
        try {
          // Try with orderBy first
          coursesQuery = query(
            collection(db, 'courses'), 
            where('departmentId', '==', selectedDepartment),
            orderBy('name')
          );
          
          await getDocs(coursesQuery); // Test if query works
        } catch (indexError) {
          console.warn('LectureManagement: Index error detected, falling back to simple query:', indexError);
          // Fall back to simple query without orderBy
          coursesQuery = query(
            collection(db, 'courses'), 
            where('departmentId', '==', selectedDepartment)
          );
        }
      } else {
        try {
          coursesQuery = query(collection(db, 'courses'), orderBy('name'));
          await getDocs(coursesQuery);
        } catch (indexError) {
          console.warn('LectureManagement: Index error detected for all courses, falling back to simple query', indexError);
          coursesQuery = query(collection(db, 'courses'));
        }
      }
      
      const querySnapshot = await getDocs(coursesQuery);
      
      const fetchedCourses = [];
      querySnapshot.forEach((doc) => {
        fetchedCourses.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('LectureManagement: Fetched courses:', fetchedCourses);
      setCourses(fetchedCourses);
      
      // Select first course by default if none selected and available courses exist
      if (fetchedCourses.length > 0 && !selectedCourse) {
        console.log('LectureManagement: Setting default course:', fetchedCourses[0].id);
        setSelectedCourse(fetchedCourses[0].id);
        setCurrentLecture(prev => ({ ...prev, courseId: fetchedCourses[0].id }));
      } else if (fetchedCourses.length === 0) {
        console.log('LectureManagement: No courses found for department:', selectedDepartment);
        setSelectedCourse('');
        setCurrentLecture(prev => ({ ...prev, courseId: '' }));
      }
    } catch (error) {
      console.error('LectureManagement: Error fetching courses:', error);
      setError('Failed to load courses. Please try again later.');
    }
  };
  
  // Fetch all lecturers
  const fetchLecturers = async () => {
    try {
      console.log('LectureManagement: Fetching lecturers...');
      
      try {
        // First attempt with compound query
        const usersQuery = query(
          collection(db, 'users'), 
          where('role', '==', USER_ROLES.LECTURER),
          orderBy('displayName')
        );
        
        const querySnapshot = await getDocs(usersQuery);
        
        const fetchedLecturers = [];
        querySnapshot.forEach((doc) => {
          fetchedLecturers.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('LectureManagement: Fetched lecturers:', fetchedLecturers);
        setLecturers(fetchedLecturers);
      } catch (indexError) {
        console.warn('LectureManagement: Index error detected for lecturers, falling back to simple query:', indexError);
        
        // Fall back to simpler query
        const usersQuery = query(
          collection(db, 'users'), 
          where('role', '==', USER_ROLES.LECTURER)
        );
        
        const querySnapshot = await getDocs(usersQuery);
        
        const fetchedLecturers = [];
        querySnapshot.forEach((doc) => {
          fetchedLecturers.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('LectureManagement: Fetched lecturers (fallback):', fetchedLecturers);
        
        // If still empty, try another approach - fetch all users and filter in code
        if (fetchedLecturers.length === 0) {
          console.log('LectureManagement: No lecturers found, trying all users approach');
          const allUsersQuery = query(collection(db, 'users'));
          const allUsersSnapshot = await getDocs(allUsersQuery);
          
          const allLecturers = [];
          allUsersSnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.role === USER_ROLES.LECTURER) {
              allLecturers.push({ id: doc.id, ...userData });
            }
          });
          
          console.log('LectureManagement: Filtered lecturers from all users:', allLecturers);
          setLecturers(allLecturers);
        } else {
          setLecturers(fetchedLecturers);
        }
      }
    } catch (error) {
      console.error('LectureManagement: Error fetching lecturers:', error);
      setError('Failed to load lecturers. Please try again later.');
    }
  };
  
  // Fetch lectures by course
  const fetchLectures = async () => {
    setIsLoading(true);
    try {
      console.log('LectureManagement: Fetching lectures for course:', selectedCourse);
      let lecturesQuery;
      
      if (selectedCourse) {
        console.log('LectureManagement: Using course-specific query with courseId:', selectedCourse);
        try {
          // First try with orderBy
          lecturesQuery = query(
            collection(db, 'lectures'), 
            where('courseId', '==', selectedCourse),
            orderBy('title')
          );
          
          // Test if the query will work
          await getDocs(lecturesQuery);
        } catch (indexError) {
          console.warn('LectureManagement: Index error detected, falling back to simple query:', indexError);
          // Fall back to simple query without orderBy
          lecturesQuery = query(
            collection(db, 'lectures'), 
            where('courseId', '==', selectedCourse)
          );
        }
      } else if (selectedDepartment) {
        console.log('LectureManagement: Using department-filtered query (fetching all lectures)');
        // If no course is selected but department is, get all lectures from courses in this department
        // This is more complex and would ideally be done with a compound query,
        // but for simplicity we'll get all lectures and filter in code
        lecturesQuery = query(collection(db, 'lectures'), orderBy('title'));
      } else {
        console.log('LectureManagement: Using all-lectures query');
        // Get all lectures
        lecturesQuery = query(collection(db, 'lectures'), orderBy('title'));
      }
      
      const querySnapshot = await getDocs(lecturesQuery);
      
      const fetchedLectures = [];
      querySnapshot.forEach((doc) => {
        fetchedLectures.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('LectureManagement: Raw fetched lectures count:', fetchedLectures.length);
      console.log('LectureManagement: Raw fetched lectures:', fetchedLectures);
      
      // If we didn't find any lectures with the specific course query, try getting all lectures
      if (fetchedLectures.length === 0 && selectedCourse) {
        console.log('LectureManagement: No lectures found for selected course, trying all lectures query');
        const allLecturesQuery = query(collection(db, 'lectures'));
        const allLecturesSnapshot = await getDocs(allLecturesQuery);
        
        allLecturesSnapshot.forEach((doc) => {
          const lectureData = doc.data();
          console.log('LectureManagement: Found lecture in all-lectures query:', { id: doc.id, ...lectureData });
          if (lectureData.courseId === selectedCourse) {
            console.log('LectureManagement: This lecture matches our selected course!');
          }
        });
      }
      
      // Map course names and lecturer names to lectures
      const lecturesWithDetails = fetchedLectures.map(lecture => {
        const course = courses.find(c => c.id === lecture.courseId);
        const lecturer = lecturers.find(l => l.id === lecture.lecturerId);
        
        // Debug check if course is found
        if (!course) {
          console.warn('LectureManagement: No course found for lecture:', lecture);
          console.log('LectureManagement: Looking for courseId:', lecture.courseId);
          console.log('LectureManagement: Available courses:', courses.map(c => ({ id: c.id, name: c.name })));
        }
        
        // Only include lectures from the selected department if department is selected but course is not
        if (selectedDepartment && !selectedCourse) {
          if (!course || course.departmentId !== selectedDepartment) {
            console.log('LectureManagement: Filtering out lecture due to department mismatch:', lecture);
            return null;
          }
        }
        
        return {
          ...lecture,
          courseName: course ? course.name : 'Unknown Course',
          courseCode: course ? course.code : '-',
          lecturerName: lecturer ? lecturer.displayName : 'Unassigned'
        };
      }).filter(Boolean); // Remove null entries (filtered out by department)
      
      console.log('LectureManagement: Final processed lectures count:', lecturesWithDetails.length);
      console.log('LectureManagement: Final processed lectures:', lecturesWithDetails);
      setLectures(lecturesWithDetails);
    } catch (error) {
      console.error('LectureManagement: Error fetching lectures:', error);
      setError('Failed to load lectures. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load departments, courses and lecturers on component mount
  useEffect(() => {
    console.log('LectureManagement: Component mounted');
    fetchDepartments();
    fetchLecturers();
  }, []);
  
  // Fetch courses when departments change
  useEffect(() => {
    console.log('LectureManagement: Department selection changed:', { 
      departmentsCount: departments.length, 
      selectedDepartment 
    });
    
    if (departments.length > 0) {
      fetchCourses();
    }
  }, [departments, selectedDepartment]);
  
  // Fetch lectures when courses change OR when selectedCourse changes
  useEffect(() => {
    console.log('LectureManagement: Course selection or courses list changed:', { 
      coursesCount: courses.length, 
      selectedCourse 
    });
    
    // Only fetch lectures if we have courses or a specific department
    if (courses.length > 0) {
      console.log('LectureManagement: Courses are loaded, fetching lectures');
      fetchLectures();
    } else if (selectedDepartment) {
      console.log('LectureManagement: No courses but department selected, still fetching lectures');
      fetchLectures();
    }
  }, [courses, selectedCourse]);
  
  // Additional useEffect to force refresh lectures when needed
  useEffect(() => {
    // If we have lectures but they need refreshing (e.g., after adding a new one)
    if (lectures.length === 0 && courses.length > 0 && !isLoading) {
      console.log('LectureManagement: No lectures but courses exist, forcing refresh');
      fetchLectures();
    }
  }, [lectures.length, courses.length, isLoading]);
  
  // Handle department filter change
  const handleDepartmentChange = (e) => {
    const newDepartmentId = e.target.value;
    console.log('LectureManagement: Department changed from', selectedDepartment, 'to', newDepartmentId);
    setSelectedDepartment(newDepartmentId);
    setSelectedCourse(''); // Reset course when department changes
    
    // Update current lecture if in form mode
    if (showForm) {
      setCurrentLecture(prev => ({ ...prev, courseId: '' }));
    }
  };
  
  // Handle course filter change
  const handleCourseChange = (e) => {
    const newCourseId = e.target.value;
    console.log('LectureManagement: Course changed from', selectedCourse, 'to', newCourseId);
    setSelectedCourse(newCourseId);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'courseId') {
      console.log('LectureManagement: Course selected in form:', value);
    }
    
    setCurrentLecture(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Reset form
  const resetForm = () => {
    setCurrentLecture({
      title: '',
      courseId: selectedCourse,
      lecturerId: '',
      semester: 1,
      creditUnits: 3,
      description: '',
      durationMonths: 3, // Default to 3 months
      isActive: true
    });
    setFormMode('add');
    setError('');
    setSuccessMessage('');
  };
  
  // Open form to add new lecture
  const handleAddLecture = () => {
    resetForm();
    setShowForm(true);
    setFormMode('add');
    
    // Set default courseId to the currently selected course
    console.log('LectureManagement: Setting default course in form:', selectedCourse);
    setCurrentLecture(prev => ({
      ...prev,
      courseId: selectedCourse
    }));
  };
  
  // Open form to edit lecture
  const handleEditLecture = (lecture) => {
    setCurrentLecture({
      id: lecture.id,
      title: lecture.title,
      courseId: lecture.courseId,
      lecturerId: lecture.lecturerId || '',
      semester: lecture.semester || 1,
      creditUnits: lecture.creditUnits || 3,
      description: lecture.description || '',
      durationMonths: lecture.durationMonths || 3, // Default to 3 months if not set
      isActive: lecture.isActive !== false
    });
    setShowForm(true);
    setFormMode('edit');
  };
  
  // Submit form to add/edit lecture
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!currentLecture.title || !currentLecture.courseId || !currentLecture.semester) {
      setError('Lecture title, course, and semester are required');
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      let newCourseId = null;
      
      if (formMode === 'add') {
        // Store the courseId to use for filtering
        newCourseId = currentLecture.courseId;
        
        // Add new lecture
        const lectureData = {
          title: currentLecture.title,
          courseId: currentLecture.courseId,
          lecturerId: currentLecture.lecturerId,
          semester: parseInt(currentLecture.semester) || 1,
          creditUnits: parseInt(currentLecture.creditUnits) || 3,
          description: currentLecture.description,
          durationMonths: parseInt(currentLecture.durationMonths) || 3,
          isActive: currentLecture.isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log('LectureManagement: Adding new lecture with data:', lectureData);
        console.log('LectureManagement: Current selected course:', selectedCourse);
        console.log('LectureManagement: Current selected department:', selectedDepartment);
        
        const docRef = await addDoc(collection(db, 'lectures'), lectureData);
        console.log('LectureManagement: Lecture added with ID:', docRef.id);
        
        // Verify the lecture was added correctly
        const addedLectureDoc = await getDoc(doc(db, 'lectures', docRef.id));
        if (addedLectureDoc.exists()) {
          const addedLectureData = addedLectureDoc.data();
          console.log('LectureManagement: Verified added lecture data:', addedLectureData);
          
          if (!addedLectureData.courseId) {
            console.error('LectureManagement: courseId is missing from saved lecture!');
          }
        }
        
        setSuccessMessage('Lecture added successfully');
      } else {
        // Store the courseId to use for filtering
        newCourseId = currentLecture.courseId;
        
        // Update existing lecture logic
        const lectureRef = doc(db, 'lectures', currentLecture.id);
        const lectureData = {
          title: currentLecture.title,
          courseId: currentLecture.courseId,
          lecturerId: currentLecture.lecturerId,
          semester: parseInt(currentLecture.semester) || 1,
          creditUnits: parseInt(currentLecture.creditUnits) || 3,
          description: currentLecture.description,
          durationMonths: parseInt(currentLecture.durationMonths) || 3,
          isActive: currentLecture.isActive,
          updatedAt: serverTimestamp()
        };
        
        console.log('LectureManagement: Updating lecture:', currentLecture.id, lectureData);
        
        await updateDoc(lectureRef, lectureData);
        console.log('LectureManagement: Lecture updated successfully');
        
        setSuccessMessage('Lecture updated successfully');
      }
      
      // Make sure the lecture's course is selected so it'll be visible
      if (selectedCourse !== newCourseId) {
        console.log('LectureManagement: Updating selected course to match lecture:', newCourseId);
        setSelectedCourse(newCourseId);
        
        // Need to wait for state update to complete before fetching
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Refresh lecture list - run this synchronously
      console.log('LectureManagement: Refreshing lecture list after add/edit');
      await fetchLectures();
      
      // Reset form and hide it after a delay to show success message
      setTimeout(() => {
        resetForm();
        setShowForm(false);
      }, 2000);
      
    } catch (error) {
      console.error('LectureManagement: Error saving lecture:', error);
      setError('Failed to save lecture. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete lecture
  const handleDeleteLecture = async (id) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      try {
        await deleteDoc(doc(db, 'lectures', id));
        setLectures(prev => prev.filter(lecture => lecture.id !== id));
      } catch (error) {
        console.error('LectureManagement: Error deleting lecture:', error);
        setError('Failed to delete lecture. Please try again.');
      }
    }
  };
  
  // Filter lectures based on search term
  const filteredLectures = lectures.filter(lecture => 
    lecture.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lecture.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lecture.lecturerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // For debugging - check what courses are available for the selected department
  const availableCourses = courses.filter(course => 
    !selectedDepartment || course.departmentId === selectedDepartment
  );
  console.log('LectureManagement: Courses available for form:', availableCourses);

  // Quick course creation
  const handleQuickCourseInputChange = (e) => {
    const { name, value } = e.target;
    setQuickCourse(prev => ({ ...prev, [name]: value }));
  };
  
  const handleQuickCourseSubmit = async (e) => {
    e.preventDefault();
    
    if (!quickCourse.name || !quickCourse.code || !selectedDepartment) {
      setError('Course name, code, and department are required');
      return;
    }
    
    setIsAddingCourse(true);
    setError('');
    
    try {
      // Check if course code already exists
      const courseQuery = query(
        collection(db, 'courses'), 
        where('code', '==', quickCourse.code)
      );
      const querySnapshot = await getDocs(courseQuery);
      
      if (!querySnapshot.empty) {
        setError(`Course with code "${quickCourse.code}" already exists`);
        setIsAddingCourse(false);
        return;
      }
      
      // Add new course
      const courseData = {
        name: quickCourse.name,
        code: quickCourse.code,
        departmentId: selectedDepartment,
        years: parseInt(quickCourse.years) || 3,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      console.log('LectureManagement: Adding quick course with data:', courseData);
      
      const docRef = await addDoc(collection(db, 'courses'), courseData);
      console.log('LectureManagement: Quick course added with ID:', docRef.id);
      
      // Refresh courses list
      await fetchCourses();
      
      // Set the newly created course as the selected course in the lecture form
      setCurrentLecture(prev => ({ ...prev, courseId: docRef.id }));
      
      // Hide quick course form
      setShowQuickCourseForm(false);
      setQuickCourse({ name: '', code: '', years: 3 });
      
      setSuccessMessage('Course added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('LectureManagement: Error creating quick course:', error);
      setError('Failed to create course. Please try again.');
    } finally {
      setIsAddingCourse(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lecture Management</h2>
        
        <button
          onClick={showForm ? () => setShowForm(false) : handleAddLecture}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          {showForm ? (
            'View All Lectures'
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Lecture
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300">
          {successMessage}
        </div>
      )}
      
      {showForm ? (
        // Lecture Form
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {formMode === 'add' ? 'Add New Lecture' : 'Edit Lecture'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Lecture Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lecture Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={currentLecture.title}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter lecture title"
                  required
                />
              </div>
              
              {/* Department */}
              <div>
                <label htmlFor="departmentSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department *
                </label>
                <select
                  id="departmentSelect"
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Course */}
              <div>
                <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course *
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    id="courseId"
                    name="courseId"
                    value={currentLecture.courseId}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    required
                  >
                    <option value="">Select a course</option>
                    {availableCourses.length > 0 ? (
                      availableCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.code})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No courses available for this department</option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowQuickCourseForm(!showQuickCourseForm)}
                    className="flex-shrink-0 p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    title="Add new course"
                  >
                    <BookPlus className="h-5 w-5" />
                  </button>
                </div>
                {availableCourses.length === 0 && selectedDepartment && !showQuickCourseForm && (
                  <p className="mt-1 text-sm text-red-500">
                    No courses found for this department. Click the "+" button to add a course.
                  </p>
                )}
                
                {/* Quick Course Creation Form */}
                {showQuickCourseForm && (
                  <div className="mt-3 p-3 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Add New Course</h4>
                    <form onSubmit={handleQuickCourseSubmit}>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                          <label htmlFor="quickCourseName" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Course Name *
                          </label>
                          <input
                            type="text"
                            id="quickCourseName"
                            name="name"
                            value={quickCourse.name}
                            onChange={handleQuickCourseInputChange}
                            className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            placeholder="Enter course name"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="quickCourseCode" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Course Code *
                          </label>
                          <input
                            type="text"
                            id="quickCourseCode"
                            name="code"
                            value={quickCourse.code}
                            onChange={handleQuickCourseInputChange}
                            className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                            placeholder="Enter course code"
                            required
                          />
                        </div>
                      </div>
                      <div className="mb-2">
                        <label htmlFor="quickCourseYears" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Duration (Years)
                        </label>
                        <input
                          type="number"
                          id="quickCourseYears"
                          name="years"
                          value={quickCourse.years}
                          onChange={handleQuickCourseInputChange}
                          className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                          min="1"
                          max="10"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowQuickCourseForm(false)}
                          className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isAddingCourse}
                          className="flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isAddingCourse ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            'Add Course'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
              
              {/* Lecturer */}
              <div>
                <label htmlFor="lecturerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lecturer
                </label>
                <select
                  id="lecturerId"
                  name="lecturerId"
                  value={currentLecture.lecturerId}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">Assign a lecturer</option>
                  {lecturers.length > 0 ? (
                    lecturers.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.displayName || lecturer.email || `Lecturer (${lecturer.id.slice(0, 6)})`}
                        {lecturer.email && !lecturer.displayName ? ` - ${lecturer.email}` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No lecturers available</option>
                  )}
                </select>
                {lecturers.length === 0 && (
                  <p className="mt-1 text-sm text-yellow-500">
                    No lecturers found. Please add lecturers in the User Management section.
                  </p>
                )}
              </div>
              
              {/* Semester */}
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester *
                </label>
                <select
                  id="semester"
                  name="semester"
                  value={currentLecture.semester}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                </select>
              </div>
              
              {/* Credit Units */}
              <div>
                <label htmlFor="creditUnits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Credit Units
                </label>
                <input
                  type="number"
                  id="creditUnits"
                  name="creditUnits"
                  value={currentLecture.creditUnits}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter credit units"
                />
              </div>
              
              {/* Lecture Duration (Months) */}
              <div>
                <label htmlFor="durationMonths" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lecture Duration (Months)
                </label>
                <input
                  type="number"
                  id="durationMonths"
                  name="durationMonths"
                  value={currentLecture.durationMonths}
                  onChange={handleInputChange}
                  min="1"
                  max="24"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter lecture duration in months"
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={currentLecture.description}
                onChange={handleInputChange}
                rows="3"
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="Enter lecture description (optional)"
              />
            </div>
            
            {/* Active Status */}
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={currentLecture.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Lecture is currently active
              </label>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {formMode === 'add' ? 'Adding...' : 'Updating...'}
                  </>
                ) : (
                  <>
                    {formMode === 'add' ? 'Add Lecture' : 'Update Lecture'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Lecture List
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Lectures</h3>
            
            <div className="flex flex-col md:flex-row gap-2 items-end md:items-center">
              {/* Department Filter */}
              <div>
                <label htmlFor="departmentFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Department
                </label>
                <select
                  id="departmentFilter"
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  className="block rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Course Filter */}
              <div>
                <label htmlFor="courseFilter" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Course
                </label>
                <select
                  id="courseFilter"
                  value={selectedCourse}
                  onChange={handleCourseChange}
                  className="block rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  disabled={!selectedDepartment}
                >
                  <option value="">All Courses</option>
                  {courses.filter(course => 
                    !selectedDepartment || course.departmentId === selectedDepartment
                  ).map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search lectures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          ) : lectures.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {selectedCourse 
                ? "No lectures found for this course. Click 'Add Lecture' to create one."
                : selectedDepartment 
                  ? "No lectures found in this department. Click 'Add Lecture' to create one."
                  : "No lectures found. Click 'Add Lecture' to create one."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Lecture Title
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Lecturer
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Semester
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration (Months)
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Credits
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredLectures.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No lectures match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredLectures.map((lecture) => (
                      <tr key={lecture.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {lecture.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {lecture.courseName} <span className="text-xs text-gray-500">({lecture.courseCode})</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {lecture.lecturerName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          Semester {lecture.semester}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {lecture.durationMonths || 3} months
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {lecture.creditUnits || 3}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <button
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              onClick={() => handleEditLecture(lecture)}
                              title="Edit lecture"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              onClick={() => handleDeleteLecture(lecture.id)}
                              title="Delete lecture"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LectureManagement; 