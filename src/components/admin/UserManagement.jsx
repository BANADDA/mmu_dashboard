import { collection, deleteDoc, doc, getDocs, query } from 'firebase/firestore';
import { AlertCircle, Eye, EyeOff, Loader2, Plus, Search, Trash, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { registerUser, sendPasswordReset, USER_ROLES } from '../../firebase/auth';
import { db } from '../../firebase/config';

const UserManagement = () => {
  // State for user list
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  // Get auth context
  const { preserveAdminSession } = useAuth();
  
  // State for user registration form
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: USER_ROLES.LECTURER // Default role
  });
  const [sendPasswordResetEmail, setSendPasswordResetEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');
  
  // Fetch users from Firestore
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      
      const fetchedUsers = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() });
      });
      
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  // Send password reset email to user
  const handleSendPasswordReset = async (email) => {
    try {
      await sendPasswordReset(email);
      // Show temporary success message
      const userIndex = users.findIndex(user => user.email === email);
      if (userIndex !== -1) {
        const updatedUsers = [...users];
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          resetEmailSent: true
        };
        setUsers(updatedUsers);
        
        // Reset the flag after 3 seconds
        setTimeout(() => {
          const resetUsers = [...updatedUsers];
          resetUsers[userIndex] = {
            ...resetUsers[userIndex],
            resetEmailSent: false
          };
          setUsers(resetUsers);
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      setDeleteError('Failed to send password reset email. Please try again.');
    }
  };
  
  // Delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        // Remove user from state
        setUsers(prev => prev.filter(user => user.id !== userId));
        setDeleteError('');
      } catch (error) {
        console.error('Error deleting user:', error);
        setDeleteError('Failed to delete user. Please try again.');
      }
    }
  };
  
  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle user registration
  const handleRegisterUser = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!newUser.email || !newUser.password || !newUser.displayName) {
      setRegistrationError('All fields are required');
      return;
    }
    
    if (newUser.password.length < 6) {
      setRegistrationError('Password must be at least 6 characters');
      return;
    }
    
    setRegistrationError('');
    setRegistrationSuccess('');
    setIsRegistering(true);
    
    try {
      // Store admin credentials to restore session after registration
      preserveAdminSession(newUser.email, newUser.password);
      
      // Register new user using Firebase
      await registerUser(
        newUser.email,
        newUser.password,
        newUser.displayName,
        newUser.role,
        sendPasswordResetEmail
      );
      
      // Clear form and show success message
      setNewUser({
        email: '',
        password: '',
        displayName: '',
        role: USER_ROLES.LECTURER
      });
      
      let successMessage = `Successfully registered ${newUser.displayName} as ${newUser.role}`;
      if (sendPasswordResetEmail) {
        successMessage += `. A password reset email has been sent to ${newUser.email}`;
      }
      
      setRegistrationSuccess(successMessage);
      
      // Fetch users again to refresh the list
      fetchUsers();
      
    } catch (error) {
      console.error('Error registering user:', error);
      
      // Format error message
      let errorMessage = 'Failed to register user.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setRegistrationError(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  // Generate random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser(prev => ({ ...prev, password }));
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h2>
        
        <button
          onClick={() => setShowRegistrationForm(!showRegistrationForm)}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          {showRegistrationForm ? (
            <>
              <Users className="h-4 w-4 mr-2" />
              View Users
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </>
          )}
        </button>
      </div>
      
      {showRegistrationForm ? (
        // User Registration Form
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Register New User</h3>
          
          {/* Success message */}
          {registrationSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-300">
              {registrationSuccess}
            </div>
          )}
          
          {/* Error message */}
          {registrationError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{registrationError}</p>
            </div>
          )}
          
          <form onSubmit={handleRegisterUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={newUser.displayName}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Password must be at least 6 characters
                  </p>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Generate random
                  </button>
                </div>
              </div>
              
              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  required
                >
                  <option value={USER_ROLES.LECTURER}>Lecturer</option>
                  <option value={USER_ROLES.ADMIN}>Administrator</option>
                </select>
              </div>
            </div>
            
            {/* Password reset option */}
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  id="send-reset-email"
                  name="send-reset-email"
                  type="checkbox"
                  checked={sendPasswordResetEmail}
                  onChange={(e) => setSendPasswordResetEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
                />
                <label htmlFor="send-reset-email" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Send password reset email to user
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                User will receive an email with a link to set their own password
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowRegistrationForm(false);
                  setRegistrationError('');
                  setRegistrationSuccess('');
                  setNewUser({
                    email: '',
                    password: '',
                    displayName: '',
                    role: USER_ROLES.LECTURER
                  });
                }}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isRegistering}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Register User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // User List
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Users</h3>
            
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Delete error message */}
          {deleteError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
            </div>
          )}
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center">
                      <Loader2 className="h-6 w-6 mx-auto text-blue-600 dark:text-blue-400 animate-spin" />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      {userSearchTerm 
                        ? 'No users found matching your search criteria.'
                        : 'No users found. Add a new user to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-medium">
                            {user.displayName?.charAt(0) || '?'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            {user.resetEmailSent && (
                              <span className="inline-flex text-xs text-green-600 dark:text-green-400">
                                Password reset email sent
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex text-xs leading-5 font-semibold rounded-full px-2 py-1 ${
                          user.role === USER_ROLES.ADMIN
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            onClick={() => handleSendPasswordReset(user.email)}
                            title="Send password reset email"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 8l-3-3m0 0L15 8m3-3v12M8 16l-3 3m0 0l3 3m-3-3H19" />
                            </svg>
                          </button>
                          <button
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete user"
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
        </div>
      )}
    </div>
  );
};

export default UserManagement; 