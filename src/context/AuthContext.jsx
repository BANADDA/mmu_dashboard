import { collection, getDocs, query, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { isAdmin, isHOD, isLecturer, loginUser, logoutUser, onAuthStateChange, registerUser, USER_ROLES } from '../firebase/auth';
import { db } from '../firebase/config';

// Create the auth context
const AuthContext = createContext();

// Default admin credentials - for first admin creation only
const DEFAULT_ADMIN = {
  email: 'admin@mmu.ac.ug',
  password: 'admin123456',
  displayName: 'System Administrator'
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  
  // Keep track of the admin user credentials to restore session
  const adminCredentialsRef = useRef(null);
  
  // Remember the current admin user
  const preserveAdminSession = (email, password) => {
    if (isAdmin(user)) {
      console.log('Preserving admin session for:', email);
      adminCredentialsRef.current = { email, password };
    }
  };
  
  // Restore admin session if needed
  const restoreAdminSession = async () => {
    const credentials = adminCredentialsRef.current;
    if (credentials && credentials.email && credentials.password) {
      console.log('Attempting to restore admin session for:', credentials.email);
      try {
        const userData = await loginUser(credentials.email, credentials.password);
        console.log('Admin session restored successfully');
        setUser(userData);
        adminCredentialsRef.current = null;
      } catch (error) {
        console.error('Failed to restore admin session:', error);
      }
    }
  };

  // Check if any admin exists in the system
  const checkForAdminUsers = async () => {
    try {
      const adminQuery = query(
        collection(db, 'users'),
        where('role', '==', USER_ROLES.ADMIN)
      );
      const querySnapshot = await getDocs(adminQuery);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking for admin users:', error);
      return false;
    }
  };

  // Create initial admin account
  const createInitialAdmin = async () => {
    if (isCreatingAdmin) return;
    
    setIsCreatingAdmin(true);
    setAuthError(null);
    
    try {
      // First check if any admin exists
      const hasAdmins = await checkForAdminUsers();
      
      if (!hasAdmins) {
        // No admins exist, create the default one
        await registerUser(
          DEFAULT_ADMIN.email,
          DEFAULT_ADMIN.password,
          DEFAULT_ADMIN.displayName,
          USER_ROLES.ADMIN
        );
        
        return {
          success: true,
          message: `Initial admin account created successfully with email: ${DEFAULT_ADMIN.email}`
        };
      } else {
        return {
          success: false,
          message: 'Admin account already exists in the system'
        };
      }
    } catch (error) {
      console.error('Error creating initial admin:', error);
      setAuthError(error.message || 'Failed to create initial admin account');
      return {
        success: false,
        message: error.message || 'Failed to create initial admin account'
      };
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  // Set up auth state listener on initial load
  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChange(async (userData) => {
      console.log('Auth state changed:', userData);
      
      // If we have admin credentials to restore and there's no user,
      // try to restore the admin session
      if (!userData && adminCredentialsRef.current) {
        console.log('No user detected but admin credentials exist, attempting to restore session');
        await restoreAdminSession();
      } else {
        setUser(userData);
        setIsLoading(false);
      }
    });
    
    // Clean up subscription on unmount
    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      console.log('LoginUser function called with email:', email);
      const userData = await loginUser(email, password);
      console.log('LoginUser returned userData:', userData);
      
      // Check if userData is valid
      if (!userData || !userData.uid) {
        const error = new Error('Invalid user data returned from authentication');
        console.error(error);
        setAuthError('Authentication error. Please try again.');
        throw error;
      }
      
      setUser(userData);
      
      // If this is an admin, save the credentials to be able to restore session
      if (isAdmin(userData)) {
        preserveAdminSession(email, password);
      }
      
      return userData;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      setAuthError(error.message || 'Failed to login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      // Clear admin credentials to prevent auto-login
      adminCredentialsRef.current = null;
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError(error.message || 'Failed to logout');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Check user roles
  const userIsAdmin = isAdmin(user);
  const userIsLecturer = isLecturer(user);
  const userIsHOD = isHOD(user);

  // Debug
  useEffect(() => {
    console.log('Current auth state:', { 
      isAuthenticated,
      isLoading, 
      user: user ? { uid: user.uid, email: user.email, role: user.role } : null,
      userIsAdmin,
      userIsLecturer,
      userIsHOD,
      hasAdminCredentials: !!adminCredentialsRef.current
    });
  }, [isAuthenticated, isLoading, user, userIsAdmin, userIsLecturer, userIsHOD]);

  // Context value
  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
    authError,
    userIsAdmin,
    userIsLecturer,
    userIsHOD,
    userRoles: USER_ROLES,
    createInitialAdmin,
    isCreatingAdmin,
    defaultAdminEmail: DEFAULT_ADMIN.email,
    preserveAdminSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 