import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { auth, db } from './config';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  LECTURER: 'lecturer',
  HOD: 'hod'
};

/**
 * Register a new user with email and password and optionally send reset password email
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @param {string} role - User role (admin or lecturer)
 * @param {boolean} sendResetEmail - Whether to send a password reset email
 * @returns {Promise<object>} User data including role
 */
export const registerUser = async (email, password, displayName, role = USER_ROLES.LECTURER, sendResetEmail = false) => {
  try {
    console.log(`Registering user: ${email} with role: ${role}`);
    
    // Store the current user before registration
    const currentUser = auth.currentUser;
    console.log('Current user before registration:', currentUser?.email);
    
    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    
    console.log(`User created in Auth with UID: ${newUser.uid}`);
    
    // Update profile with display name
    await updateProfile(newUser, { displayName });
    
    // Store additional user data in Firestore
    const userData = {
      uid: newUser.uid,
      email: newUser.email,
      displayName,
      role,
      createdAt: serverTimestamp()
    };
    
    console.log(`Storing user data in Firestore: `, userData);
    await setDoc(doc(db, 'users', newUser.uid), userData);
    
    // Send password reset email if requested
    if (sendResetEmail) {
      console.log(`Sending password reset email to: ${email}`);
      await sendPasswordResetEmail(auth, email);
    }
    
    // If there was a user logged in before and we're not in the initial admin setup,
    // we need to sign back in as the original user
    if (currentUser && currentUser.uid !== newUser.uid) {
      console.log(`Signing back in as original user: ${currentUser.email}`);
      
      // We can't directly sign back in with the current user,
      // we'll need to trigger an auth state change to restore the original session
      await signOut(auth);
      
      // The auth state listener in AuthContext will handle
      // restoring the session for the original user
    }
    
    console.log(`User registration complete: ${newUser.uid}`);
    return { ...userData, uid: newUser.uid };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Send password reset email to a user
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const sendPasswordReset = async (email) => {
  try {
    console.log(`Sending password reset email to: ${email}`);
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: `Password reset email sent to ${email}` };
  } catch (error) {
    console.error('Error sending password reset:', error);
    throw error;
  }
};

/**
 * Sign in a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} User data including role
 */
export const loginUser = async (email, password) => {
  try {
    console.log(`Attempting login for: ${email}`);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`Firebase Auth login successful for: ${user.uid}`);
    
    // Get additional user data from Firestore
    console.log(`Fetching user data from Firestore for: ${user.uid}`);
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log(`User data found in Firestore:`, userData);
      return { ...userData, uid: user.uid };
    } else {
      console.warn(`User authenticated but no Firestore document found for: ${user.uid}`);
      // If user exists in Authentication but not in Firestore,
      // create a default entry (this should rarely happen)
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split('@')[0],
        role: USER_ROLES.LECTURER, // Default role
        createdAt: serverTimestamp()
      };
      
      console.log(`Creating default user data in Firestore:`, userData);
      await setDoc(doc(db, 'users', user.uid), userData);
      return userData;
    }
  } catch (error) {
    console.error(`Login error for ${email}:`, error);
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    console.log('Signing out user');
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get current user data including role from Firestore
 * @param {object} user - Firebase auth user
 * @returns {Promise<object|null>} User data with role or null
 */
export const getCurrentUserData = async (user) => {
  if (!user) {
    console.log('getCurrentUserData called with no user');
    return null;
  }
  
  try {
    console.log(`Getting data for user: ${user.uid}`);
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log(`User data retrieved from Firestore:`, userData);
      return { ...userData, uid: user.uid };
    }
    
    console.warn(`No user document found in Firestore for user: ${user.uid}`);
    return null;
  } catch (error) {
    console.error(`Error getting user data for ${user.uid}:`, error);
    return null;
  }
};

/**
 * Check if a user is an admin
 * @param {object} userData - User data object with role
 * @returns {boolean} True if user is admin
 */
export const isAdmin = (userData) => {
  const result = userData?.role === USER_ROLES.ADMIN;
  if (userData) console.log(`isAdmin check for ${userData.email}: ${result}`);
  return result;
};

/**
 * Check if a user is a lecturer
 * @param {object} userData - User data object with role
 * @returns {boolean} True if user is lecturer
 */
export const isLecturer = (userData) => {
  const result = userData?.role === USER_ROLES.LECTURER;
  if (userData) console.log(`isLecturer check for ${userData.email}: ${result}`);
  return result;
};

/**
 * Check if a user is Head of Department
 * @param {object} userData - User data object with role
 * @returns {boolean} True if user is HOD
 */
export const isHOD = (userData) => {
  const result = userData?.role === USER_ROLES.HOD;
  if (userData) console.log(`isHOD check for ${userData.email}: ${result}`);
  return result;
};

/**
 * Set up an auth state listener
 * @param {function} callback - Callback function to run when auth state changes
 * @returns {function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  console.log('Setting up auth state listener');
  
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, get additional data
      console.log(`Auth state changed: User signed in: ${user.uid}`);
      const userData = await getCurrentUserData(user);
      
      if (userData) {
        console.log(`Calling auth state callback with user data:`, userData);
        callback(userData);
      } else {
        console.error(`User authenticated but no data found in Firestore for: ${user.uid}`);
        callback(null);
      }
    } else {
      // User is signed out
      console.log('Auth state changed: User signed out');
      callback(null);
    }
  });
}; 