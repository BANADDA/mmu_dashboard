// Import the functions you need from the SDKs you need
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8bMbjZIdPx1Pkn1yK6W4TIoMEqwOyQTs",
  authDomain: "whatsapp-5d6e2.firebaseapp.com",
  projectId: "whatsapp-5d6e2",
  storageBucket: "whatsapp-5d6e2.firebasestorage.app",
  messagingSenderId: "797621628352",
  appId: "1:797621628352:web:d9c9c1aa630fe53bbc6c25",
  measurementId: "G-X44WVWJMWH"
};

// Initialize Firebase
let app, analytics, auth, db;

try {
  console.log('Initializing Firebase with config:', { 
    projectId: firebaseConfig.projectId, 
    authDomain: firebaseConfig.authDomain 
  });
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Only initialize analytics if it's supported (not in SSR environments)
  isSupported().then(isSupported => {
    if (isSupported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    } else {
      console.log('Firebase Analytics not supported in this environment');
    }
  });
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Debug auth state changes globally
auth.onAuthStateChanged((user) => {
  console.log('Global auth state changed:', user ? `User logged in: ${user.uid}` : 'User logged out');
});

export { analytics, app, auth, db };

