import { useState } from 'react';
import './App.css';
import CalendarView from './components/calendar/CalendarView';
import { CoursesView } from './components/courses';
import DashboardView from './components/dashboard/DashboardView';
import BottomNav from './components/layout/BottomNav';
import Header from './components/layout/Header';
import Layout from './components/layout/Layout';
import Sidebar from './components/layout/Sidebar';
import { CalendarProvider } from './context/CalendarContext';

function App() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'calendar', or 'courses'
  
  return (
    <CalendarProvider>
      <Layout>
        <Header currentView={currentView} onViewChange={setCurrentView} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar onScheduleClick={() => setShowScheduleModal(true)} />
          
          {currentView === 'dashboard' ? (
            <DashboardView />
          ) : currentView === 'calendar' ? (
            <CalendarView 
              showScheduleModal={showScheduleModal} 
              setShowScheduleModal={setShowScheduleModal} 
            />
          ) : (
            <CoursesView />
          )}
        </div>
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      </Layout>
    </CalendarProvider>
  );
}

export default App;
