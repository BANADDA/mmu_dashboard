import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { AlertCircle, Edit, Loader2, Plus, Search, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';

const ProgramManagement = () => {
  // State for program list
  const [programs, setPrograms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  
  // State for program form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentProgram, setCurrentProgram] = useState({
    name: '',
    code: '',
    departmentId: '',
    duration: 3, // Default duration in years
    description: '',
    isActive: true
  });
  
  // State for operations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      const departmentsQuery = query(collection(db, 'departments'), orderBy('name'));
      const querySnapshot = await getDocs(departmentsQuery);
      
      const fetchedDepartments = [];
      querySnapshot.forEach((doc) => {
        fetchedDepartments.push({ id: doc.id, ...doc.data() });
      });
      
      setDepartments(fetchedDepartments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to load departments. Please try again later.');
    }
  };
  
  // Fetch all programs
  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      let programsQuery;
      
      if (selectedDepartment && selectedDepartment !== 'all') {
        programsQuery = query(
          collection(db, 'programs'),
          where('departmentId', '==', selectedDepartment),
          orderBy('name')
        );
      } else {
        programsQuery = query(collection(db, 'programs'), orderBy('name'));
      }
      
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load departments and programs on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);
  
  // Fetch programs when department filter changes
  useEffect(() => {
    if (departments.length > 0) {
      fetchPrograms();
    }
  }, [departments, selectedDepartment]);
  
  // Handle department filter change
  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentProgram(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Generate program code based on name
  const generateProgramCode = (name) => {
    if (!name) return '';
    
    // Extract initials from words
    const initials = name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    // Add random number
    const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit random number
    return `${initials}${randomNum}`;
  };
  
  // Reset form
  const resetForm = () => {
    setCurrentProgram({
      name: '',
      code: '',
      departmentId: selectedDepartment !== 'all' ? selectedDepartment : '',
      duration: 3,
      description: '',
      isActive: true
    });
    setFormMode('add');
    setError('');
    setSuccessMessage('');
  };
  
  // Open form to add new program
  const handleAddProgram = () => {
    resetForm();
    setShowForm(true);
    setFormMode('add');
  };
  
  // Open form to edit program
  const handleEditProgram = (program) => {
    setCurrentProgram({
      id: program.id,
      name: program.name,
      code: program.code,
      departmentId: program.departmentId,
      duration: program.duration || 3,
      description: program.description || '',
      isActive: program.isActive !== false
    });
    setShowForm(true);
    setFormMode('edit');
  };
  
  // Submit form to add/edit program
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!currentProgram.name || !currentProgram.code || !currentProgram.departmentId) {
      setError('Program name, code, and department are required');
      return;
    }
    
    // Check for duplicate program code
    if (formMode === 'add') {
      const duplicateCode = programs.find(
        program => program.code === currentProgram.code
      );
      
      if (duplicateCode) {
        setError(`Program code "${currentProgram.code}" is already in use`);
        return;
      }
    }
    
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      if (formMode === 'add') {
        // Add new program
        const programData = {
          name: currentProgram.name,
          code: currentProgram.code,
          departmentId: currentProgram.departmentId,
          duration: parseInt(currentProgram.duration) || 3,
          description: currentProgram.description,
          isActive: currentProgram.isActive,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'programs'), programData);
        setSuccessMessage('Program added successfully');
      } else {
        // Update existing program
        const programRef = doc(db, 'programs', currentProgram.id);
        const programData = {
          name: currentProgram.name,
          code: currentProgram.code,
          departmentId: currentProgram.departmentId,
          duration: parseInt(currentProgram.duration) || 3,
          description: currentProgram.description,
          isActive: currentProgram.isActive,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(programRef, programData);
        setSuccessMessage('Program updated successfully');
      }
      
      // Refresh program list
      fetchPrograms();
      
      // Reset form after short delay
      setTimeout(() => {
        resetForm();
        setShowForm(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving program:', error);
      setError('Failed to save program. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete program
  const handleDeleteProgram = async (id) => {
    if (window.confirm('Are you sure you want to delete this program? This will also delete all course units associated with this program.')) {
      try {
        await deleteDoc(doc(db, 'programs', id));
        setPrograms(prev => prev.filter(program => program.id !== id));
      } catch (error) {
        console.error('Error deleting program:', error);
        setError('Failed to delete program. Please try again.');
      }
    }
  };
  
  // Filter programs based on search term
  const filteredPrograms = programs.filter(program => 
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    program.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Program Management</h2>
        
        <button
          onClick={showForm ? () => setShowForm(false) : handleAddProgram}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          {showForm ? (
            'View All Programs'
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Program
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
        // Program Form
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {formMode === 'add' ? 'Add New Program' : 'Edit Program'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Program Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Program Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={currentProgram.name}
                  onChange={(e) => {
                    handleInputChange(e);
                    // Auto-generate code if empty and in add mode
                    if (formMode === 'add' && !currentProgram.code) {
                      setCurrentProgram(prev => ({
                        ...prev,
                        code: generateProgramCode(e.target.value)
                      }));
                    }
                  }}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter program name (e.g. Bachelor of Science in Computer Science)"
                  required
                />
              </div>
              
              {/* Program Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Program Code *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={currentProgram.code}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter program code (e.g. BSC-CS)"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Unique identifier for this program
                </p>
              </div>
              
              {/* Department */}
              <div>
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department *
                </label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={currentProgram.departmentId}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value="">Select a department</option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Program Duration */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (years) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={currentProgram.duration}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  min="1"
                  max="10"
                  required
                />
              </div>
              
              {/* Program Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={currentProgram.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter program description"
                />
              </div>
              
              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={currentProgram.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Program is currently active
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
                  formMode === 'add' ? 'Add Program' : 'Update Program'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Programs List
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Programs</h3>
              
              {/* Department Filter */}
              <div className="ml-4">
                <select
                  id="departmentFilter"
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                  className="block rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-xs"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
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
                placeholder="Search programs..."
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
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "No programs match your search."
                : selectedDepartment !== 'all'
                  ? "No programs found for this department. Click 'Add Program' to create one."
                  : "No programs found. Click 'Add Program' to create one."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Program
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Code
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration
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
                  {filteredPrograms.map((program) => (
                    <tr key={program.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {program.name}
                        </div>
                        {program.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {program.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {program.code}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {program.departmentName || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {program.duration || 3} {program.duration === 1 ? 'year' : 'years'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${
                          program.isActive !== false
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {program.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            onClick={() => handleEditProgram(program)}
                            title="Edit program"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            onClick={() => handleDeleteProgram(program.id)}
                            title="Delete program"
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

export default ProgramManagement; 