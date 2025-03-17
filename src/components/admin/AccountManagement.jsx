import { doc, updateDoc } from 'firebase/firestore';
import { AlertCircle, KeyRound, Loader2, LogOut, User, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendPasswordReset } from '../../firebase/auth';
import { db } from '../../firebase/config';

const AccountManagement = () => {
  const { user, logout } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || ''
  });

  // Handle profile data change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!profileData.displayName.trim()) {
      setError('Display name is required');
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      // Update user document in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName.trim()
      });
      
      setSuccessMessage('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request password reset
  const handlePasswordReset = async () => {
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      await sendPasswordReset(user.email);
      setSuccessMessage(`Password reset email sent to ${user.email}. Please check your inbox.`);
    } catch (error) {
      console.error('Error requesting password reset:', error);
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      // Redirect is handled by the auth context/router
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out. Please try again.');
    }
  };

  // Format last login time
  const formatLastLogin = () => {
    if (user?.metadata?.lastSignInTime) {
      return new Date(user.metadata.lastSignInTime).toLocaleString();
    }
    return 'Not available';
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account Management</h2>
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <UserCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Information</h3>
          </div>
          
          {isEditingProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={profileData.displayName}
                  onChange={handleProfileChange}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Enter your display name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm cursor-not-allowed"
                  placeholder="Your email"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email address cannot be changed</p>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
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
                      Updating...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Display Name</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.displayName || 'Not set'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                  <p className="mt-1 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                      {user?.role || 'Admin'}
                    </span>
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user?.createdAt?.toDate().toLocaleString() || 'Not available'}
                  </p>
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Account Actions */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-4">
            <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Actions</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <button
                onClick={handlePasswordReset}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Sends a password reset link to your email
              </p>
            </div>
            
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Signs you out of the admin dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Security Section */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center mb-4">
          <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatLastLogin()}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</p>
            <p className="mt-1 text-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                Active
              </span>
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            For security reasons, we recommend regularly changing your password and not sharing your account credentials.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement; 