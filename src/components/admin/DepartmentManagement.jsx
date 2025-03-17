import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AlertCircle, Edit, Loader2, Plus, Search, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';

const DepartmentManagement = () => {
  // State for department list
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for department form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [currentDepartment, setCurrentDepartment] = useState({
    name: '',
    code: '',
    description: ''
  });
  
  // State for operations
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch all departments
  const fetchDepartments = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDepartment(prev => ({ ...prev, [name]: value }));
  };
  
  // Reset form
  const resetForm = () => {
    setCurrentDepartment({
      name: '',
      code: '',
      description: ''
    });
    setFormMode('add');
    setError('');
    setSuccessMessage('');
  };
  
  // Open form to add new department
  const handleAddDepartment = () => {
    resetForm();
    setShowForm(true);
    setFormMode('add');
  };
  
  // Open form to edit department
  const handleEditDepartment = (department) => {
    setCurrentDepartment({
      id: department.id,
      name: department.name,
      code: department.code,
      description: department.description || ''
    });
    setShowForm(true);
    setFormMode('edit');
  };
  
  // Submit form to add/edit department
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!currentDepartment.name || !currentDepartment.code) {
      setError('Department name and code are required');
      return;
    }
    
    // Check for duplicate department code
    const duplicateCode = departments.find(
      dept => dept.code === currentDepartment.code && dept.id !== currentDepartment.id
    );
    
    if (duplicateCode) {
      setError(`Department code "${currentDepartment.code}" is already in use`);
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      if (formMode === 'add') {
        // Add new department
        const departmentData = {
          name: currentDepartment.name,
          code: currentDepartment.code,
          description: currentDepartment.description,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await addDoc(collection(db, 'departments'), departmentData);
        setSuccessMessage('Department added successfully');
      } else {
        // Update existing department
        const departmentRef = doc(db, 'departments', currentDepartment.id);
        const departmentData = {
          name: currentDepartment.name,
          code: currentDepartment.code,
          description: currentDepartment.description,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(departmentRef, departmentData);
        setSuccessMessage('Department updated successfully');
      }
      
      // Refresh department list
      fetchDepartments();
      
      // Reset form after short delay
      setTimeout(() => {
        resetForm();
        setShowForm(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error saving department:', error);
      setError('Failed to save department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete department
  const handleDeleteDepartment = async (id) => {
    if (window.confirm('Are you sure you want to delete this department? This will also delete all courses and lectures associated with this department.')) {
      try {
        await deleteDoc(doc(db, 'departments', id));
        setDepartments(prev => prev.filter(dept => dept.id !== id));
      } catch (error) {
        console.error('Error deleting department:', error);
        setError('Failed to delete department. Please try again.');
      }
    }
  };
  
  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Department Management</h2>
        
        <button
          onClick={showForm ? () => setShowForm(false) : handleAddDepartment}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          {showForm ? (
            'View All Departments'
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
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
        // Department Form
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {formMode === 'add' ? 'Add New Department' : 'Edit Department'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Department Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={currentDepartment.name}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter department name"
                  required
                />
              </div>
              
              {/* Department Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={currentDepartment.code}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter department code (e.g. CS, ENG)"
                  required
                />
              </div>
            </div>
            
            {/* Department Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={currentDepartment.description}
                onChange={handleInputChange}
                rows="3"
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="Enter department description (optional)"
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
                    {formMode === 'add' ? 'Add Department' : 'Update Department'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Department List
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Departments</h3>
            
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search departments..."
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
          ) : departments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No departments found. Click "Add Department" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Department Name
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Code
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No departments match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((department) => (
                      <tr key={department.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {department.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {department.code}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {department.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          <div className="flex space-x-2 justify-end">
                            <button
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              onClick={() => handleEditDepartment(department)}
                              title="Edit department"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              onClick={() => handleDeleteDepartment(department.id)}
                              title="Delete department"
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

export default DepartmentManagement; 