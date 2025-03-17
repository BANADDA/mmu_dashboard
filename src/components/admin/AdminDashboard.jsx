import {
    BookOpen,
    Building2,
    Calendar,
    Home,
    Menu,
    Settings,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import AccountManagement from './AccountManagement';
import CourseManagement from './CourseManagement';
import DashboardHome from './DashboardHome';
import DepartmentManagement from './DepartmentManagement';
import LectureAssignment from './LectureAssignment';
import LectureManagement from './LectureManagement';
import StudentManagement from './StudentManagement';
import UserManagement from './UserManagement';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Setup is complete, remove loading state
    setLoading(false);
  }, []);

  const tabs = [
    { id: 'home', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    { id: 'departments', label: 'Departments', icon: <Building2 className="h-5 w-5" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="h-5 w-5" /> },
    { id: 'lectures', label: 'Lectures', icon: <Calendar className="h-5 w-5" /> },
    { id: 'lecture-assignment', label: 'Lecture Assignment', icon: <Calendar className="h-5 w-5" /> },
    { id: 'students', label: 'Students', icon: <Users className="h-5 w-5" /> },
    { id: 'account', label: 'Account Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardHome />;
      case 'users':
        return <UserManagement />;
      case 'departments':
        return <DepartmentManagement />;
      case 'courses':
        return <CourseManagement />;
      case 'lectures':
        return <LectureManagement />;
      case 'lecture-assignment':
        return <LectureAssignment />;
      case 'students':
        return <StudentManagement />;
      case 'account':
        return <AccountManagement />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header 
        user={user} 
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        activeTab={activeTab}
        onChangeTab={handleTabChange}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          isOpen={isSidebarOpen}
        />
        
        <main className={`flex-1 overflow-auto transition-all duration-200 ${isSidebarOpen ? 'ml-0 md:ml-64' : 'ml-0'}`}>
          <div className="py-4 px-6 h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-3 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                </div>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </main>
      </div>
      
      {/* Mobile sidebar toggle button */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-10"
      >
        <Menu className="h-6 w-6" />
      </button>
    </div>
  );
};

export default AdminDashboard; 