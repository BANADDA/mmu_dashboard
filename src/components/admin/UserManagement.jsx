import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { AlertCircle, Eye, EyeOff, Loader2, Search, Trash, UserPlus, Users } from 'lucide-react';
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
    role: USER_ROLES.HOD // Default role for the admin is to create HODs
  });
  const [sendPasswordResetEmail, setSendPasswordResetEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState('');
  
  // Fetch HOD users from Firestore
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', USER_ROLES.HOD)
      );
      const querySnapshot = await getDocs(usersQuery);
      
      const fetchedUsers = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() });
      });
      
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching HOD users:', error);
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
    if (window.confirm('Are you sure you want to delete this HOD? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        // Remove user from state
        setUsers(prev => prev.filter(user => user.id !== userId));
        setDeleteError('');
      } catch (error) {
        console.error('Error deleting HOD:', error);
        setDeleteError('Failed to delete HOD. Please try again.');
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
  
  // Reset form
  const resetForm = () => {
    setNewUser({
      email: '',
      password: '',
      displayName: '',
      role: USER_ROLES.HOD
    });
    setRegistrationError('');
    setRegistrationSuccess('');
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
      
      // Register new HOD user
      await registerUser(
        newUser.email,
        newUser.password,
        newUser.displayName,
        USER_ROLES.HOD,
        sendPasswordResetEmail
      );
      
      // Clear form and show success message
      setNewUser({
        email: '',
        password: '',
        displayName: '',
        role: USER_ROLES.HOD
      });
      
      let successMessage = `Successfully registered ${newUser.displayName} as Head of Department`;
      if (sendPasswordResetEmail) {
        successMessage += `. A password reset email has been sent to ${newUser.email}`;
      }
      
      setRegistrationSuccess(successMessage);
      
      // Fetch users again to refresh the list
      fetchUsers();
      
    } catch (error) {
      console.error('Error registering HOD:', error);
      
      // Format error message
      let errorMessage = 'Failed to register HOD.';
      
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Head of Department Management</h2>
        
        <button
          onClick={() => setShowRegistrationForm(!showRegistrationForm)}
          className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          {showRegistrationForm ? (
            <>
              <Users className="h-4 w-4 mr-2" />
              View HODs
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Add HOD
            </>
          )}
        </button>
      </div>
      
      {showRegistrationForm ? (
        // HOD Registration Form
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Register New Head of Department</h3>
          
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
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm pr-10"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Must be at least 6 characters
                  </span>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Generate Password
                  </button>
                </div>
              </div>
              
              {/* Send Reset Email */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendPasswordResetEmail"
                  checked={sendPasswordResetEmail}
                  onChange={() => setSendPasswordResetEmail(!sendPasswordResetEmail)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="sendPasswordResetEmail" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Send password reset email
                </label>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowRegistrationForm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRegistering}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register HOD'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // HOD List
        <>
          {deleteError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{deleteError}</p>
            </div>
          )}
          
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100"
                placeholder="Search HODs by name or email"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {isLoadingUsers ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Loading HODs...</span>
            </div>
          ) : (
            <>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No HODs Found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {users.length === 0 
                      ? "You haven't registered any Heads of Department yet."
                      : "No results match your search criteria."
                    }
                  </p>
                  {users.length === 0 && (
                    <button
                      onClick={() => setShowRegistrationForm(true)}
                      className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md inline-flex items-center"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register First HOD
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {user.displayName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Head of Department
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {user.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleSendPasswordReset(user.email)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 ml-4"
                            >
                              {user.resetEmailSent ? "✓ Email Sent" : "Reset Password"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-4"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UserManagement; 