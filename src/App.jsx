import { useState } from 'react';
import './App.css';
import AdminDashboard from './components/admin/AdminDashboard';
import LoginPage from './components/auth/LoginPage';
import CalendarView from './components/calendar/CalendarView';
import { ToastProvider } from './components/common/ToastManager';
import { CoursesView } from './components/courses';
import DashboardView from './components/dashboard/DashboardView';
import { LectureHistoryView } from './components/history';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import Layout from './components/layout/Layout';
import Sidebar from './components/layout/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CalendarProvider } from './context/CalendarContext';

function AppContent() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'calendar', 'courses', or 'history'
  const { isAuthenticated, isLoading, userIsAdmin } = useAuth();
  
  // Show a loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  
  // If user is admin, show admin dashboard
  if (userIsAdmin) {
    return <AdminDashboard />;
  }
  
  // Check if the sidebar should be visible
  const showSidebar = currentView === 'dashboard' || currentView === 'calendar';
  
  // If authenticated as lecturer, show the lecturer interface
  return (
    <CalendarProvider>
      <Layout>
        <Header currentView={currentView} onViewChange={setCurrentView} />
        <div className="flex flex-1 overflow-hidden">
          {/* Only render sidebar for dashboard and calendar views */}
          {showSidebar && (
            <Sidebar onScheduleClick={() => setShowScheduleModal(true)} />
          )}
          
          <div className={`flex-1 overflow-auto transition-all duration-200 ${!showSidebar ? 'w-full px-6 py-4 md:px-8 md:py-6' : ''}`}>
            {currentView === 'dashboard' ? (
              <DashboardView />
            ) : currentView === 'calendar' ? (
              <CalendarView 
                showScheduleModal={showScheduleModal} 
                setShowScheduleModal={setShowScheduleModal} 
              />
            ) : currentView === 'courses' ? (
              <CoursesView />
            ) : (
              <LectureHistoryView />
            )}
          </div>
        </div>
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      </Layout>
    </CalendarProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
