import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { AlertCircle, BookPlus, Edit, Loader2, Plus, Search, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';

const StudentManagement = () => {
  // State for student list
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // State for student form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentStudent, setCurrentStudent] = useState({
    name: '',
    studentId: '',
    email: '',
    courseId: '',
    enrollmentDate: '',
    graduationDate: '',
    phone: '',
    address: '',
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
      console.log('StudentManagement: Fetching departments...');
      const departmentsQuery = query(collection(db, 'departments'), orderBy('name'));
      const querySnapshot = await getDocs(departmentsQuery);
      
      const fetchedDepartments = [];
      querySnapshot.forEach((doc) => {
        fetchedDepartments.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('StudentManagement: Fetched departments:', fetchedDepartments);
      setDepartments(fetchedDepartments);
      
      // Select first department by default if none selected
      if (fetchedDepartments.length > 0 && !selectedDepartment) {
        console.log('StudentManagement: Setting default department:', fetchedDepartments[0].id);
        setSelectedDepartment(fetchedDepartments[0].id);
      }
    } catch (error) {
      console.error('StudentManagement: Error fetching departments:', error);
      setError('Failed to load departments. Please try again later.');
    }
  };
  
  // Fetch courses by department
  const fetchCourses = async () => {
    try {
      console.log('StudentManagement: Fetching courses for department:', selectedDepartment);
      let coursesQuery;
      
      if (selectedDepartment) {
        try {
          // First attempt with orderBy
          coursesQuery = query(
            collection(db, 'courses'), 
            where('departmentId', '==', selectedDepartment),
            orderBy('name')
          );
          
          await getDocs(coursesQuery); // Test if query works
        } catch (indexError) {
          console.warn('StudentManagement: Index error detected, falling back to simple query:', indexError);
          // Fall back to simple query without orderBy
          coursesQuery = query(
            collection(db, 'courses'), 
            where('departmentId', '==', selectedDepartment)
          );
        }
      } else {
        try {
          coursesQuery = query(collection(db, 'courses'), orderBy('name'));
          await getDocs(coursesQuery); // Test if query works
        } catch (indexError) {
          console.warn('StudentManagement: Index error detected for all courses, falling back to simple query', indexError);
          coursesQuery = query(collection(db, 'courses'));
        }
      }
      
      const querySnapshot = await getDocs(coursesQuery);
      
      const fetchedCourses = [];
      querySnapshot.forEach((doc) => {
        fetchedCourses.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('StudentManagement: Fetched courses:', fetchedCourses);
      setCourses(fetchedCourses);
      
      // Select first course by default if none selected and available courses exist
      if (fetchedCourses.length > 0 && !selectedCourse) {
        console.log('StudentManagement: Setting default course:', fetchedCourses[0].id);
        setSelectedCourse(fetchedCourses[0].id);
        setCurrentStudent(prev => ({ ...prev, courseId: fetchedCourses[0].id }));
      } else if (fetchedCourses.length === 0) {
        console.log('StudentManagement: No courses found for department:', selectedDepartment);
        setSelectedCourse('');
        setCurrentStudent(prev => ({ ...prev, courseId: '' }));
      }
    } catch (error) {
      console.error('StudentManagement: Error fetching courses:', error);
      setError('Failed to load courses. Please try again later.');
    }
  };
  
  // Fetch students by course
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      console.log('StudentManagement: Fetching students for course:', selectedCourse);
      console.log('StudentManagement: Selected department:', selectedDepartment);
      
      let studentsQuery;
      
      if (selectedCourse) {
        console.log('StudentManagement: Using course-specific query');
        try {
          // First try with orderBy
          studentsQuery = query(
            collection(db, 'students'), 
            where('courseId', '==', selectedCourse),
            orderBy('name')
          );
          
          // Test if the query will work
          await getDocs(studentsQuery);
        } catch (indexError) {
          console.warn('StudentManagement: Index error detected, falling back to simple query:', indexError);
          // Fall back to simple query without orderBy
          studentsQuery = query(
            collection(db, 'students'), 
            where('courseId', '==', selectedCourse)
          );
        }
      } else if (selectedDepartment) {
        console.log('StudentManagement: Using department-filtered query (fetching all students)');
        // If no course is selected but department is, get all students and filter in code
        studentsQuery = query(collection(db, 'students'), orderBy('name'));
      } else {
        console.log('StudentManagement: Using all-students query');
        // Get all students
        studentsQuery = query(collection(db, 'students'), orderBy('name'));
      }
      
      const querySnapshot = await getDocs(studentsQuery);
      
      const fetchedStudents = [];
      querySnapshot.forEach((doc) => {
        fetchedStudents.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('StudentManagement: Raw fetched students count:', fetchedStudents.length);
      console.log('StudentManagement: Raw fetched students:', fetchedStudents);
      
      // If we didn't find any students with the specific course query, try getting all students
      if (fetchedStudents.length === 0 && selectedCourse) {
        console.log('StudentManagement: No students found for selected course, trying all students query');
        const allStudentsQuery = query(collection(db, 'students'));
        const allStudentsSnapshot = await getDocs(allStudentsQuery);
        
        allStudentsSnapshot.forEach((doc) => {
          const studentData = doc.data();
          console.log('StudentManagement: Found student in all-students query:', { id: doc.id, ...studentData });
          if (studentData.courseId === selectedCourse) {
            console.log('StudentManagement: This student matches our selected course!');
          }
        });
      }
      
      // Map course names and lecturer names to students
      const studentsWithDetails = fetchedStudents.map(student => {
        const course = courses.find(c => c.id === student.courseId);
        
        // Debug check if course is found
        if (!course) {
          console.warn('StudentManagement: No course found for student:', student);
          console.log('StudentManagement: Looking for courseId:', student.courseId);
          console.log('StudentManagement: Available courses:', courses.map(c => ({ id: c.id, name: c.name })));
        }
        
        // Only include students from the selected department if department is selected but course is not
        if (selectedDepartment && !selectedCourse) {
          if (!course || !course.departmentId || course.departmentId !== selectedDepartment) {
            console.log('StudentManagement: Filtering out student due to department mismatch:', student);
            return null;
          }
        }
        
        // Find department for this course
        const department = departments.find(d => course && d.id === course?.departmentId);
        
        return {
          ...student,
          courseName: course ? course.name : 'Unknown Course',
          courseCode: course ? course.code : '-',
          departmentName: department ? department.name : 'Unknown Department'
        };
      }).filter(Boolean); // Remove null entries (filtered out by department)
      
      console.log('StudentManagement: Final processed students count:', studentsWithDetails.length);
      console.log('StudentManagement: Final processed students:', studentsWithDetails);
      setStudents(studentsWithDetails);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load departments and courses on component mount
  useEffect(() => {
    console.log('StudentManagement: Component mounted');
    fetchDepartments();
  }, []);
  
  // Fetch courses when departments change
  useEffect(() => {
    console.log('StudentManagement: Department selection changed:', { 
      departmentsCount: departments.length, 
      selectedDepartment 
    });
    
    if (departments.length > 0) {
      fetchCourses();
    }
  }, [departments, selectedDepartment]);
  
  // Fetch students when courses change or when selectedCourse changes
  useEffect(() => {
    console.log('StudentManagement: Course selection or courses list changed:', { 
      coursesCount: courses.length, 
      selectedCourse 
    });
    
    // Only fetch students if we have courses or a specific department
    if (courses.length > 0) {
      console.log('StudentManagement: Courses are loaded, fetching students');
      fetchStudents();
    } else if (selectedDepartment) {
      console.log('StudentManagement: No courses but department selected, still fetching students');
      fetchStudents();
    }
  }, [courses, selectedCourse]);
  
  // Additional useEffect to force refresh students when needed
  useEffect(() => {
    // If we have no students but courses exist and we're not loading, force a refresh
    if (students.length === 0 && courses.length > 0 && !isLoading) {
      console.log('StudentManagement: No students but courses exist, forcing refresh');
      fetchStudents();
    }
  }, [students.length, courses.length, isLoading]);
  
  // Handle department filter change
  const handleDepartmentChange = (e) => {
    const newDepartmentId = e.target.value;
    setSelectedDepartment(newDepartmentId);
    setSelectedCourse(''); // Reset course when department changes
    
    // Update current student if in form mode
    if (showForm) {
      setCurrentStudent(prev => ({ ...prev, courseId: '' }));
    }
  };
  
  // Handle course filter change
  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };
  
  // Generate unique student ID
  const generateStudentId = () => {
    const year = new Date().getFullYear().toString().substr(-2);
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    return `STU${year}${randomNum}`;
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentStudent(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Reset form
  const resetForm = () => {
    setCurrentStudent({
      name: '',
      studentId: generateStudentId(),
      email: '',
      courseId: selectedCourse,
      enrollmentDate: new Date().toISOString().split('T')[0], // Current date
      graduationDate: '',
      phone: '',
      address: '',
      isActive: true
    });
    setFormMode('add');
    setError('');
    setSuccessMessage('');
  };
  
  // Open form to add new student
  const handleAddStudent = () => {
    resetForm();
    setShowForm(true);
    setFormMode('add');
    
    // Set default courseId to the currently selected course
    setCurrentStudent(prev => ({
      ...prev,
      courseId: selectedCourse,
      studentId: generateStudentId(),
      enrollmentDate: new Date().toISOString().split('T')[0]
    }));
  };
  
  // Open form to edit student
  const handleEditStudent = (student) => {
    setCurrentStudent({
      id: student.id,
      name: student.name,
      studentId: student.studentId,
      email: student.email || '',
      courseId: student.courseId,
      enrollmentDate: student.enrollmentDate || '',
      graduationDate: student.graduationDate || '',
      phone: student.phone || '',
      address: student.address || '',
      isActive: student.isActive !== false
    });
    setShowForm(true);
    setFormMode('edit');
  };
  
  // Submit form to add/edit student
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!currentStudent.name || !currentStudent.studentId || !currentStudent.courseId) {
      setError('Student name, ID, and course are required');
      return;
    }
    
    // Check for duplicate student ID
    if (formMode === 'add') {
      const duplicateId = students.find(
        student => student.studentId === currentStudent.studentId
      );
      
      if (duplicateId) {
        setError(`Student ID "${currentStudent.studentId}" is already in use`);
        return;
      }
    }
    
    // Email validation
    if (currentStudent.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentStudent.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      let newCourseId = null;
      
      if (formMode === 'add') {
        // Store the courseId to use for filtering
        newCourseId = currentStudent.courseId;
        
        // Add new student
        const studentData = {
          name: currentStudent.name,
          studentId: currentStudent.studentId,
          email: currentStudent.email,
          courseId: currentStudent.courseId,
          enrollmentDate: currentStudent.enrollmentDate,
          graduationDate: currentStudent.graduationDate,
          phone: currentStudent.phone,
          address: currentStudent.address,
          isActive: currentStudent.isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log('StudentManagement: Adding new student with data:', studentData);
        console.log('StudentManagement: Current selected course:', selectedCourse);
        console.log('StudentManagement: Current selected department:', selectedDepartment);
        
        const docRef = await addDoc(collection(db, 'students'), studentData);
        console.log('StudentManagement: Student added with ID:', docRef.id);
        
        setSuccessMessage('Student added successfully');
      } else {
        // Store the courseId to use for filtering
        newCourseId = currentStudent.courseId;
        
        // Update existing student
        const studentRef = doc(db, 'students', currentStudent.id);
        const studentData = {
          name: currentStudent.name,
          email: currentStudent.email,
          courseId: currentStudent.courseId,
          enrollmentDate: currentStudent.enrollmentDate,
          graduationDate: currentStudent.graduationDate,
          phone: currentStudent.phone,
          address: currentStudent.address,
          isActive: currentStudent.isActive,
          updatedAt: serverTimestamp()
        };
        
        console.log('StudentManagement: Updating student:', currentStudent.id, studentData);
        
        await updateDoc(studentRef, studentData);
        console.log('StudentManagement: Student updated successfully');
        
        setSuccessMessage('Student updated successfully');
      }
      
      // Make sure the student's course is selected so it'll be visible
      if (selectedCourse !== newCourseId) {
        console.log('StudentManagement: Updating selected course to match student:', newCourseId);
        setSelectedCourse(newCourseId);
        
        // Need to wait for state update to complete before fetching
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Refresh student list - run this synchronously
      console.log('StudentManagement: Refreshing student list after add/edit');
      await fetchStudents();
      
      // Reset form and hide it after a delay to show success message
      setTimeout(() => {
        resetForm();
        setShowForm(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving student:', error);
      setError('Failed to save student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete student
  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteDoc(doc(db, 'students', id));
        setStudents(prev => prev.filter(student => student.id !== id));
      } catch (error) {
        console.error('Error deleting student:', error);
        setError('Failed to delete student. Please try again.');
      }
    }
  };
  
  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
      
      console.log('StudentManagement: Adding quick course with data:', courseData);
      
      const docRef = await addDoc(collection(db, 'courses'), courseData);
      console.log('StudentManagement: Quick course added with ID:', docRef.id);
      
      // Refresh courses list
      await fetchCourses();
      
      // Set the newly created course as the selected course in the student form
      setCurrentStudent(prev => ({ ...prev, courseId: docRef.id }));
      
      // Hide quick course form
      setShowQuickCourseForm(false);
      setQuickCourse({ name: '', code: '', years: 3 });
      
      setSuccessMessage('Course added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('StudentManagement: Error creating quick course:', error);
      setError('Failed to create course. Please try again.');
    } finally {
      setIsAddingCourse(false);
    }
  };
  
  // For debugging - check what courses are available for the selected department
  const availableCourses = courses.filter(course => 
    !selectedDepartment || course.departmentId === selectedDepartment
  );
  console.log('StudentManagement: Courses available for form:', availableCourses);

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Management</h2>
        
        <button
          onClick={showForm ? () => setShowForm(false) : handleAddStudent}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          {showForm ? (
            'View All Students'
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
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
        // Student Form
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {formMode === 'add' ? 'Add New Student' : 'Edit Student'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Student Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={currentStudent.name}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter student name"
                  required
                />
              </div>
              
              {/* Student ID */}
              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student ID *
                </label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={currentStudent.studentId}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter student ID"
                  readOnly={formMode === 'edit'} // Can't change ID when editing
                  required
                />
                {formMode === 'add' && (
                  <button 
                    type="button" 
                    onClick={() => setCurrentStudent(prev => ({ ...prev, studentId: generateStudentId() }))}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1"
                  >
                    Generate new ID
                  </button>
                )}
              </div>
              
              {/* Student Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={currentStudent.email}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter student email"
                />
              </div>
              
              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={currentStudent.phone}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter phone number"
                />
              </div>
              
              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={currentStudent.address}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter student address"
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
                    value={currentStudent.courseId}
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
              </div>
              
              {/* Enrollment Date */}
              <div>
                <label htmlFor="enrollmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enrollment Date
                </label>
                <input
                  type="date"
                  id="enrollmentDate"
                  name="enrollmentDate"
                  value={currentStudent.enrollmentDate}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              
              {/* Graduation Date */}
              <div>
                <label htmlFor="graduationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Graduation Date
                </label>
                <input
                  type="date"
                  id="graduationDate"
                  name="graduationDate"
                  value={currentStudent.graduationDate}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>
              
              {/* Active Status */}
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={currentStudent.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Student is currently active
                </label>
              </div>
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
                    {formMode === 'add' ? 'Add Student' : 'Update Student'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Student List
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Students</h3>
            
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
                  placeholder="Search students..."
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
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {selectedCourse 
                ? "No students found in this course. Click 'Add Student' to create one."
                : selectedDepartment 
                  ? "No students found in this department. Click 'Add Student' to create one."
                  : "No students found. Click 'Add Student' to create one."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Semester
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No students match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {student.studentId}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <div>
                            {student.name}
                            {student.email && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {student.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {student.courseName} <span className="text-xs text-gray-500">({student.courseCode})</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {student.departmentName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          Semester {student.currentSemester || 1}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${
                            student.isActive 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {student.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <button
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              onClick={() => handleEditStudent(student)}
                              title="Edit student"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              onClick={() => handleDeleteStudent(student.id)}
                              title="Delete student"
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
  );
};

export default StudentManagement; 