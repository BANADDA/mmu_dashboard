import { createContext, useContext, useState } from 'react';

const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const value = {
    selectedDate,
    setSelectedDate,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}; 