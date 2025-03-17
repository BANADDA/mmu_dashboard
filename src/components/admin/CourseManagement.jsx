import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { AlertCircle, Edit, Loader2, Plus, Search, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';

const CourseManagement = () => {
  // State for course list
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // State for course form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentCourse, setCurrentCourse] = useState({
    name: '',
    code: '',
    departmentId: '',
    description: '',
    years: 3, // Default to 3 years
    isActive: true
  });
  
  // State for operations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      const departmentsQuery = query(collection(db, 'departments'), orderBy('name'));
      const querySnapshot = await getDocs(departmentsQuery);
      
      const fetchedDepartments = [];
      querySnapshot.forEach((doc) => {
        fetchedDepartments.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('Fetched departments:', fetchedDepartments);
      setDepartments(fetchedDepartments);
      
      // Select first department by default if none selected
      if (fetchedDepartments.length > 0 && !selectedDepartment) {
        console.log('Setting default department:', fetchedDepartments[0].id);
        setSelectedDepartment(fetchedDepartments[0].id);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments. Please try again later.');
    }
  };
  
  // Fetch all courses or by department
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching courses with selectedDepartment:', selectedDepartment);
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
          console.warn('Index error detected, falling back to simple query:', indexError);
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
          console.warn('Index error detected, falling back to simple query:', indexError);
          coursesQuery = query(collection(db, 'courses'));
        }
      }
      
      const querySnapshot = await getDocs(coursesQuery);
      
      const fetchedCourses = [];
      querySnapshot.forEach((doc) => {
        fetchedCourses.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('Fetched courses:', fetchedCourses);
      
      // Map department names to courses
      const coursesWithDepartments = fetchedCourses.map(course => {
        const department = departments.find(d => d.id === course.departmentId);
        return {
          ...course,
          departmentName: department ? department.name : 'Unknown Department'
        };
      });
      
      console.log('Processed courses with departments:', coursesWithDepartments);
      setCourses(coursesWithDepartments);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load departments and courses on component mount
  useEffect(() => {
    console.log('CourseManagement component mounted');
    fetchDepartments();
  }, []);
  
  // Fetch courses when departments are loaded or selected department changes
  useEffect(() => {
    console.log('Departments or selectedDepartment changed:', { 
      departmentsCount: departments.length, 
      selectedDepartment 
    });
    
    if (departments.length > 0) {
      fetchCourses();
    }
  }, [departments, selectedDepartment]);
  
  // Handle department filter change
  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentCourse(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Reset form
  const resetForm = () => {
    setCurrentCourse({
      name: '',
      code: '',
      departmentId: selectedDepartment,
      description: '',
      years: 3, // Default to 3 years
      isActive: true
    });
    setFormMode('add');
    setError('');
    setSuccessMessage('');
  };
  
  // Open form to add new course
  const handleAddCourse = () => {
    resetForm();
    setShowForm(true);
    setFormMode('add');
    
    // Set default departmentId to the currently selected department
    setCurrentCourse(prev => ({
      ...prev,
      departmentId: selectedDepartment
    }));
  };
  
  // Open form to edit course
  const handleEditCourse = (course) => {
    setCurrentCourse({
      id: course.id,
      name: course.name,
      code: course.code,
      departmentId: course.departmentId,
      description: course.description || '',
      years: course.years || (course.durationMonths ? Math.round(course.durationMonths / 12) : 3), // Convert from months if needed
      isActive: course.isActive !== false
    });
    setShowForm(true);
    setFormMode('edit');
  };
  
  // Submit form to add/edit course
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!currentCourse.name || !currentCourse.code || !currentCourse.departmentId) {
      setError('Course name, code, and department are required');
      return;
    }
    
    // Check for duplicate course code
    const duplicateCode = courses.find(
      course => course.code === currentCourse.code && course.id !== currentCourse.id
    );
    
    if (duplicateCode) {
      setError(`Course code "${currentCourse.code}" is already in use`);
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      if (formMode === 'add') {
        // Add new course
        const courseData = {
          name: currentCourse.name,
          code: currentCourse.code,
          departmentId: currentCourse.departmentId,
          description: currentCourse.description,
          years: parseInt(currentCourse.years) || 3,
          isActive: currentCourse.isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log('Adding new course with data:', courseData);
        
        // Verify departmentId is valid
        const departmentRef = doc(db, 'departments', currentCourse.departmentId);
        const departmentDoc = await getDoc(departmentRef);
        
        if (!departmentDoc.exists()) {
          console.error('Department does not exist with ID:', currentCourse.departmentId);
          setError('The selected department does not exist. Please try again.');
          setIsSubmitting(false);
          return;
        }
        
        console.log('Verified department exists:', departmentDoc.data());
        
        const docRef = await addDoc(collection(db, 'courses'), courseData);
        console.log('Course added with ID:', docRef.id);
        
        // Verify the course was added correctly
        const addedCourseDoc = await getDoc(doc(db, 'courses', docRef.id));
        if (addedCourseDoc.exists()) {
          const addedCourseData = addedCourseDoc.data();
          console.log('Verified added course data:', addedCourseData);
          
          if (!addedCourseData.departmentId) {
            console.error('departmentId is missing from saved course!');
          }
        }
        
        setSuccessMessage('Course added successfully');
      } else {
        // Update existing course
        const courseRef = doc(db, 'courses', currentCourse.id);
        const courseData = {
          name: currentCourse.name,
          code: currentCourse.code,
          departmentId: currentCourse.departmentId,
          description: currentCourse.description,
          years: parseInt(currentCourse.years) || 3,
          isActive: currentCourse.isActive,
          updatedAt: serverTimestamp()
        };
        
        console.log('Updating course with ID:', currentCourse.id, 'and data:', courseData);
        await updateDoc(courseRef, courseData);
        console.log('Course updated successfully');
        setSuccessMessage('Course updated successfully');
      }
      
      // Wait for a moment to ensure Firestore has processed the change
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh course list
      await fetchCourses();
      
      // Reset form after short delay
      setTimeout(() => {
        resetForm();
        setShowForm(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving course:', error);
      setError('Failed to save course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete course
  const handleDeleteCourse = async (id) => {
    if (window.confirm('Are you sure you want to delete this course? This will also delete all lectures and students associated with this course.')) {
      try {
        await deleteDoc(doc(db, 'courses', id));
        setCourses(prev => prev.filter(course => course.id !== id));
      } catch (error) {
        console.error('Error deleting course:', error);
        setError('Failed to delete course. Please try again.');
      }
    }
  };
  
  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Management</h2>
        
        <button
          onClick={showForm ? () => setShowForm(false) : handleAddCourse}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          {showForm ? (
            'View All Courses'
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
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
        // Course Form
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {formMode === 'add' ? 'Add New Course' : 'Edit Course'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Course Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={currentCourse.name}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter course name"
                  required
                />
              </div>
              
              {/* Course Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course Code *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={currentCourse.code}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter course code (e.g. CS101)"
                  required
                />
              </div>
              
              {/* Department */}
              <div>
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department *
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={currentCourse.departmentId}
                  onChange={handleInputChange}
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
              
              {/* Course Duration (Years) */}
              <div>
                <label htmlFor="years" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course Duration (Years)
                </label>
                <input
                  type="number"
                  id="years"
                  name="years"
                  value={currentCourse.years}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter course duration in years"
                />
              </div>
              
              {/* Active Status */}
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={currentCourse.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Course is currently active
                </label>
              </div>
            </div>
            
            {/* Course Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={currentCourse.description}
                onChange={handleInputChange}
                rows="3"
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="Enter course description (optional)"
              />
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
                    {formMode === 'add' ? 'Add Course' : 'Update Course'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Course List
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Courses</h3>
            
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
              
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
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
          ) : courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {selectedDepartment 
                ? "No courses found in this department. Click 'Add Course' to create one."
                : "No courses found. Click 'Add Course' to create one."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Code
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration (Years)
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
                  {filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No courses match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course) => (
                      <tr key={course.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {course.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {course.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {course.departmentName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {course.years || (course.durationMonths ? Math.round(course.durationMonths/12) : 3)} years
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${
                            course.isActive 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {course.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <button
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              onClick={() => handleEditCourse(course)}
                              title="Edit course"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              onClick={() => handleDeleteCourse(course.id)}
                              title="Delete course"
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

export default CourseManagement; 