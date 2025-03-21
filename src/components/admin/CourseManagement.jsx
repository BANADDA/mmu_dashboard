import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { AlertCircle, Edit, Loader2, Plus, Search, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';

const CourseManagement = () => {
  // State for courses list
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
  
  // State for course form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentCourse, setCurrentCourse] = useState({
    name: '',
    code: '',
    creditUnits: 3,
    programIds: [], // Course can be in multiple programs
    year: 1,
    semester: 1,
    description: '',
    isActive: true
  });
  
  // State for operations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch all programs 
  const fetchPrograms = async () => {
    try {
      const programsQuery = query(collection(db, 'programs'), orderBy('name'));
      const querySnapshot = await getDocs(programsQuery);
      
      const fetchedPrograms = [];
      
      for (const programDoc of querySnapshot.docs) {
        const programData = { id: programDoc.id, ...programDoc.data() };
        
        // Get department name
        try {
          if (programData.departmentId) {
            const departmentDoc = await getDoc(doc(db, 'departments', programData.departmentId));
            if (departmentDoc.exists()) {
              programData.departmentName = departmentDoc.data().name;
            }
          }
        } catch (error) {
          console.error('Error fetching department for program:', error);
        }
        
        fetchedPrograms.push(programData);
      }
      
      setPrograms(fetchedPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Failed to load programs. Please try again later.');
    }
  };
  
  // Fetch all courses
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      let coursesQuery;
      
      if (selectedProgram && selectedProgram !== 'all') {
        coursesQuery = query(
          collection(db, 'courses'),
          where('programIds', 'array-contains', selectedProgram),
          orderBy('name')
        );
      } else {
        coursesQuery = query(collection(db, 'courses'), orderBy('name'));
      }
      
      const querySnapshot = await getDocs(coursesQuery);
      
      const fetchedCourses = [];
      for (const courseDoc of querySnapshot.docs) {
        const courseData = { id: courseDoc.id, ...courseDoc.data() };
        
        // Get program names for display
        const coursePrograms = [];
        if (courseData.programIds && courseData.programIds.length > 0) {
          for (const programId of courseData.programIds) {
            const program = programs.find(p => p.id === programId);
            if (program) {
              coursePrograms.push({
                id: program.id,
                name: program.name,
                code: program.code
              });
            }
          }
        }
        
        courseData.programs = coursePrograms;
        fetchedCourses.push(courseData);
      }
      
      setCourses(fetchedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchPrograms();
  }, []);
  
  // Fetch courses when programs are loaded or program filter changes
  useEffect(() => {
    if (programs.length > 0) {
      fetchCourses();
    }
  }, [programs, selectedProgram]);
  
  // Handle program filter change
  const handleProgramChange = (e) => {
    setSelectedProgram(e.target.value);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'programIds') {
      const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
      setCurrentCourse(prev => ({
        ...prev,
        programIds: selectedOptions
      }));
    } else {
      setCurrentCourse(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : 
                type === 'number' ? parseInt(value, 10) : value
      }));
    }
  };
  
  // Generate course code
  const generateCourseCode = (name) => {
    if (!name) return '';
    
    // Extract initials from words or use first 3 chars
    const prefix = name.length > 3 ? 
      name.split(' ').map(word => word.charAt(0).toUpperCase()).join('') :
      name.substring(0, 3).toUpperCase();
    
    // Add random number
    const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit random number
    return `${prefix}${randomNum}`;
  };
  
  // Reset form
  const resetForm = () => {
    setCurrentCourse({
      name: '',
      code: '',
      creditUnits: 3,
      programIds: [],
      year: 1,
      semester: 1,
      description: '',
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
  };
  
  // Open form to edit course
  const handleEditCourse = (course) => {
    setCurrentCourse({
      id: course.id,
      name: course.name,
      code: course.code,
      creditUnits: course.creditUnits || 3,
      programIds: course.programIds || [],
      year: course.year || 1,
      semester: course.semester || 1,
      description: course.description || '',
      isActive: course.isActive !== false
    });
    setShowForm(true);
    setFormMode('edit');
  };
  
  // Submit form to add/edit course
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!currentCourse.name || !currentCourse.code || currentCourse.programIds.length === 0) {
      setError('Course name, code, and at least one program are required');
      return;
    }
    
    // Check for duplicate course code
    if (formMode === 'add') {
      const duplicateCode = courses.find(
        course => course.code === currentCourse.code
      );
      
      if (duplicateCode) {
        setError(`Course code "${currentCourse.code}" is already in use`);
        return;
      }
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
          creditUnits: currentCourse.creditUnits,
          programIds: currentCourse.programIds,
          year: currentCourse.year,
          semester: currentCourse.semester,
          description: currentCourse.description,
          isActive: currentCourse.isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'courses'), courseData);
        setSuccessMessage('Course added successfully');
      } else {
        // Update existing course
        const courseRef = doc(db, 'courses', currentCourse.id);
        const courseData = {
          name: currentCourse.name,
          code: currentCourse.code,
          creditUnits: currentCourse.creditUnits,
          programIds: currentCourse.programIds,
          year: currentCourse.year,
          semester: currentCourse.semester,
          description: currentCourse.description,
          isActive: currentCourse.isActive,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(courseRef, courseData);
        setSuccessMessage('Course updated successfully');
      }
      
      // Refresh course list
      fetchCourses();
      
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
    if (window.confirm('Are you sure you want to delete this course?')) {
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
    course.programs?.some(program => 
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Unit Management</h2>
        
        <button
          onClick={showForm ? () => setShowForm(false) : handleAddCourse}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          {showForm ? (
            'View All Courses'
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Course Unit
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
            {formMode === 'add' ? 'Add New Course Unit' : 'Edit Course Unit'}
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
                  onChange={(e) => {
                    handleInputChange(e);
                    // Auto-generate code if empty and in add mode
                    if (formMode === 'add' && !currentCourse.code) {
                      setCurrentCourse(prev => ({
                        ...prev,
                        code: generateCourseCode(e.target.value)
                      }));
                    }
                  }}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter course name (e.g. Introduction to Programming)"
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
                  placeholder="Enter course code (e.g. CSC101)"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Unique identifier for this course
                </p>
              </div>
              
              {/* Programs (multi-select) */}
              <div className="md:col-span-2">
                <label htmlFor="programIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Programs *
                </label>
                <select
                  id="programIds"
                  name="programIds"
                  multiple
                  value={currentCourse.programIds}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  size={3}
                  required
                >
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.code}) - {program.departmentName}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Hold Ctrl/Cmd key to select multiple programs (a course unit can appear in multiple programs)
                </p>
              </div>
              
              {/* Credit Units */}
              <div>
                <label htmlFor="creditUnits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Credit Units *
                </label>
                <input
                  type="number"
                  id="creditUnits"
                  name="creditUnits"
                  value={currentCourse.creditUnits}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  min="1"
                  max="10"
                  required
                />
              </div>
              
              {/* Year of Study */}
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year of Study *
                </label>
                <select
                  id="year"
                  name="year"
                  value={currentCourse.year}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="1">Year 1</option>
                  <option value="2">Year 2</option>
                  <option value="3">Year 3</option>
                  <option value="4">Year 4</option>
                  <option value="5">Year 5</option>
                </select>
              </div>
              
              {/* Semester */}
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester *
                </label>
                <select
                  id="semester"
                  name="semester"
                  value={currentCourse.semester}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
              
              {/* Course Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={currentCourse.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter course description"
                />
              </div>
              
              {/* Active Status */}
              <div className="flex items-center">
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
                  formMode === 'add' ? 'Add Course' : 'Update Course'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Courses List
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Course Units</h3>
              
              {/* Program Filter */}
              <div className="ml-4">
                <select
                  id="programFilter"
                  value={selectedProgram}
                  onChange={handleProgramChange}
                  className="block rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-xs"
                >
                  <option value="all">All Programs</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </option>
                  ))}
                </select>
              </div>
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
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "No courses match your search."
                : selectedProgram !== 'all'
                  ? "No courses found for this program. Click 'Add Course Unit' to create one."
                  : "No courses found. Click 'Add Course Unit' to create one."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Code
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Programs
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Credits
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Year/Sem
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
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {course.name}
                        </div>
                        {course.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {course.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {course.code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div className="flex flex-col space-y-1">
                          {course.programs && course.programs.length > 0 ? (
                            course.programs.map((program, index) => (
                              <span key={index} className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                {program.code}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">No programs</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {course.creditUnits || 3}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        Year {course.year || 1}, Sem {course.semester || 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${
                          course.isActive !== false
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {course.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
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

export default CourseManagement; 