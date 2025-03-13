import { addDays, eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, MoreHorizontal, Plus, Search, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import ScheduleLectureForm from './ScheduleLectureForm';

const CalendarView = ({ showScheduleModal, setShowScheduleModal }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { selectedDate, setSelectedDate } = useCalendar();
  const [isExporting, setIsExporting] = useState(false);
  const [lectures, setLectures] = useState([
    {
      id: 1,
      title: 'Software Engineering Lecture',
      unit: 'Software Engineering',
      room: 'Block A - Room 101',
      startTime: '09:00',
      endTime: '11:00',
      date: new Date(2024, 2, 20),
      classRep: 'John Doe',
      color: 'bg-blue-500'
    },
    {
      id: 2,
      title: 'Database Systems Lab',
      unit: 'Database Systems',
      room: 'Block B - Lab 203',
      startTime: '14:00',
      endTime: '16:00',
      date: new Date(2024, 2, 21),
      classRep: 'Jane Smith',
      color: 'bg-green-500'
    }
  ]);
  
  // Generate sample events for demo
  useEffect(() => {
    const today = new Date();
    const sampleEvents = [
      {
        id: 1,
        title: 'Software Engineering Lecture',
        description: 'Introduction to SDLC and Agile methodologies',
        startTime: new Date(today.setHours(9, 0, 0)),
        endTime: new Date(today.setHours(11, 0, 0)),
        location: 'Block A - Room 101',
        classRep: 'John Doe',
        type: 'lecture',
        unit: 'Software Engineering'
      },
      {
        id: 2,
        title: 'Database Systems Lab',
        description: 'Practical SQL queries and database design',
        startTime: new Date(today.setHours(13, 0, 0)),
        endTime: new Date(today.setHours(15, 0, 0)),
        location: 'Block B - Lab 203',
        classRep: 'Jane Smith',
        type: 'lab',
        unit: 'Database Systems'
      },
      {
        id: 3,
        title: 'Web Development Tutorial',
        description: 'JavaScript frameworks and modern web practices',
        startTime: new Date(addDays(today, 2).setHours(15, 0, 0)),
        endTime: new Date(addDays(today, 2).setHours(17, 0, 0)),
        location: 'Block A - Room 101',
        classRep: 'Mike Johnson',
        type: 'tutorial',
        unit: 'Web Development'
      },
      {
        id: 4,
        title: 'Operating Systems Lecture',
        description: 'Process management and scheduling algorithms',
        startTime: new Date(today.setHours(16, 0, 0)),
        endTime: new Date(today.setHours(18, 0, 0)),
        location: 'Block C - Room 305',
        classRep: 'Sarah Williams',
        type: 'lecture',
        unit: 'Operating Systems'
      },
      {
        id: 5,
        title: 'Computer Networks Workshop',
        description: 'Network configuration and troubleshooting',
        startTime: new Date(addDays(today, 1).setHours(10, 0, 0)),
        endTime: new Date(addDays(today, 1).setHours(12, 0, 0)),
        location: 'Block B - Lab 204',
        classRep: 'Alex Johnson',
        type: 'workshop',
        unit: 'Computer Networks'
      },
      {
        id: 6,
        title: 'Mobile Development Lab',
        description: 'Android application development',
        startTime: new Date(addDays(today, 1).setHours(14, 0, 0)),
        endTime: new Date(addDays(today, 1).setHours(16, 0, 0)),
        location: 'Block B - Lab 201',
        classRep: 'Robert Chen',
        type: 'lab',
        unit: 'Mobile Development'
      },
      {
        id: 7,
        title: 'Algorithms Lecture',
        description: 'Sorting and searching algorithms',
        startTime: new Date(addDays(today, -1).setHours(8, 30, 0)),
        endTime: new Date(addDays(today, -1).setHours(10, 30, 0)),
        location: 'Block A - Room 102',
        classRep: 'Emily Parker',
        type: 'lecture',
        unit: 'Algorithms and Data Structures'
      }
    ];
    
    setEvents(sampleEvents);
  }, []);
  
  // Generate days of the week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start from Monday
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6)
  });
  
  // Hours for the day
  const hours = Array.from({ length: 12 }).map((_, index) => index + 8); // 8 AM to 7 PM
  
  // Navigate to previous week
  const gotoPrevWeek = () => {
    setSelectedDate(prevDate => addDays(prevDate, -7));
  };
  
  // Navigate to next week
  const gotoNextWeek = () => {
    setSelectedDate(prevDate => addDays(prevDate, 7));
  };

  // Go to today
  const gotoToday = () => {
    setSelectedDate(new Date());
  };
  
  // Check if event is on a specific day and hour
  const getEventsForTimeSlot = (day, hour) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, day) && eventDate.getHours() === hour;
    });
  };
  
  // Get event duration in hours
  const getEventDuration = (event) => {
    return (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  };
  
  // Get event color based on type and time
  const getEventColor = (event) => {
    const now = new Date();
    const eventEnd = new Date(event.endTime);
    
    // Check if event has ended
    if (eventEnd < now) {
      return 'bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300';
    }
    
    switch (event.type) {
      case 'lecture':
        return 'bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 dark:text-blue-200';
      case 'lab':
        return 'bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 dark:text-green-200';
      case 'tutorial':
        return 'bg-purple-100 dark:bg-purple-900/50 border-l-4 border-purple-500 dark:text-purple-200';
      case 'workshop':
        return 'bg-orange-100 dark:bg-orange-900/50 border-l-4 border-orange-500 dark:text-orange-200';
      default:
        return 'bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 dark:text-blue-200';
    }
  };
  
  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const getLecturesForDateAndTime = (date, time) => {
    return lectures.filter(lecture => {
      const lectureDate = new Date(lecture.date);
      return (
        lectureDate.getDate() === date.getDate() &&
        lectureDate.getMonth() === date.getMonth() &&
        lectureDate.getFullYear() === date.getFullYear() &&
        lecture.startTime === time
      );
    });
  };

  const handleScheduleLecture = (newLecture) => {
    setLectures(prev => [...prev, {
      ...newLecture,
      date: new Date(newLecture.date)
    }]);
  };

  // Function to export the weekly schedule as PDF
  const exportWeeklySchedule = () => {
    try {
      setIsExporting(true);
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add MMU Logo and title
      doc.setFillColor(0, 87, 184); // MMU Blue
      doc.rect(0, 0, 297, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('MOUNTAINS OF MOON UNIVERSITY', 148.5, 10, { align: 'center' });
      
      // Add schedule title and date range
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      const dateRangeText = `${format(weekStart, 'dd MMM yyyy')} - ${format(weekEnd, 'dd MMM yyyy')}`;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text('Weekly Lecture Schedule', 148.5, 25, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(dateRangeText, 148.5, 32, { align: 'center' });
      
      // Generate the data for the table
      const tableData = [];
      const allEventsForWeek = [...events, ...lectures]
        .filter(event => {
          const eventDate = new Date(event.startTime || event.date);
          const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
          return eventDate >= weekStart && eventDate <= weekEnd;
        })
        .sort((a, b) => {
          const dateA = new Date(a.startTime || a.date);
          const dateB = new Date(b.startTime || b.date);
          return dateA - dateB;
        });
      
      allEventsForWeek.forEach(event => {
        const eventDate = new Date(event.startTime || event.date);
        const dayOfWeek = format(eventDate, 'EEEE');
        const startTime = event.startTime || format(eventDate, 'HH:mm');
        const endTime = event.endTime || (event.startTime ? format(new Date(event.endTime), 'HH:mm') : '');
        const timeDisplay = endTime ? `${startTime} - ${endTime}` : startTime;
        
        tableData.push([
          dayOfWeek,
          format(eventDate, 'dd MMM yyyy'),
          timeDisplay,
          event.title,
          event.unit || '',
          event.room || event.location || '',
          event.classRep || ''
        ]);
      });
      
      if (tableData.length === 0) {
        // If no events, show message
        doc.setTextColor(100, 100, 100);
        doc.text('No lectures scheduled for this week', 148.5, 50, { align: 'center' });
      } else {
        // Add the table to the PDF
        autoTable(doc, {
          startY: 40,
          head: [['Day', 'Date', 'Time', 'Lecture Title', 'Unit', 'Location', 'Class Rep']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [0, 87, 184],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          },
          styles: {
            fontSize: 10,
            cellPadding: 3,
            valign: 'middle'
          },
          columnStyles: {
            0: { cellWidth: 30 }, // Day
            1: { cellWidth: 30 }, // Date
            2: { cellWidth: 30 }, // Time
            3: { cellWidth: 60 }, // Lecture Title
            4: { cellWidth: 45 }, // Unit
            5: { cellWidth: 45 }, // Location
            6: { cellWidth: 30 }  // Class Rep
          }
        });
      }
      
      // Add footer with date and page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on ${format(new Date(), 'dd MMM yyyy, HH:mm')} | Page ${i} of ${pageCount}`, 148.5, 200, { align: 'center' });
        doc.text('Mountains of Moon University - LectureHub', 148.5, 205, { align: 'center' });
      }
      
      // Save the PDF
      doc.save(`MMU_Schedule_${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
      
      console.log('PDF exported successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="flex-1 overflow-auto">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <button 
              onClick={gotoToday}
              className="py-1 px-3 text-sm rounded-md border border-gray-300 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Today
            </button>
            <div className="flex items-center">
              <button 
                onClick={gotoPrevWeek}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                onClick={gotoNextWeek}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <h2 className="text-xl font-semibold dark:text-white">{format(selectedDate, 'MMMM yyyy')}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="flex items-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-1.5 transition-colors w-64">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search calendar"
                  className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400 dark:text-gray-300"
                />
                <span className="text-xs text-gray-400">Ctrl+F</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <select className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-mmu-blue dark:text-gray-300">
                  <option>All events</option>
                  <option>Work week</option>
                  <option>Custom</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="calendar-grid bg-white dark:bg-gray-900 transition-colors duration-200">
          {/* Time slots column */}
          <div className="time-column w-16 border-r border-gray-200 dark:border-gray-700">
            <div className="h-12 border-b border-gray-200 dark:border-gray-700"></div>
            {hours.map(hour => (
              <div key={hour} className="h-16 border-b border-gray-200 dark:border-gray-700 pr-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                  {hour >= 12 ? (hour === 12 ? '12 PM' : `${hour - 12} PM`) : `${hour} AM`}
                </div>
              </div>
            ))}
          </div>
          
          {/* Days columns */}
          <div className="flex-1 grid grid-cols-7">
            {/* Day headers */}
            {weekDays.map((day, index) => (
              <div key={index} className="border-r border-gray-200 dark:border-gray-700 h-12 flex flex-col items-center justify-center border-b">
                <div className="text-xs text-gray-500 dark:text-gray-400">{format(day, 'EEE')}</div>
                <div className={`text-sm font-medium ${
                  isSameDay(day, new Date()) 
                    ? 'bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center' 
                    : 'dark:text-gray-300'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
            
            {/* Time slots for each day */}
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="day-column border-r border-gray-200 dark:border-gray-700">
                {hours.map(hour => {
                  const eventsForSlot = getEventsForTimeSlot(day, hour);
                  const lecturesForSlot = getLecturesForDateAndTime(day, hour);
                  
                  return (
                    <div key={hour} className="h-16 border-b border-gray-200 dark:border-gray-700 relative">
                      {eventsForSlot.map(event => (
                        <div 
                          key={event.id}
                          className={`calendar-event absolute w-full cursor-pointer ${getEventColor(event)}`}
                          style={{ 
                            height: `${getEventDuration(event) * 4}rem`,
                            zIndex: 10
                          }}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="font-medium">{event.title}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                          </div>
                          {event.location && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{event.location}</div>
                          )}
                        </div>
                      ))}
                      {lecturesForSlot.map(lecture => (
                        <div 
                          key={lecture.id}
                          className={`calendar-event absolute w-full cursor-pointer ${lecture.color} bg-opacity-90`}
                          style={{ 
                            height: '76px',
                            zIndex: 10
                          }}
                          onClick={() => handleEventClick(lecture)}
                        >
                          <div className="text-xs text-white font-medium">
                            {lecture.title}
                          </div>
                          <div className="text-xs text-white opacity-90">
                            {lecture.room}
                          </div>
                          <div className="text-xs text-white opacity-90">
                            {`${lecture.startTime} - ${lecture.endTime}`}
                          </div>
                          <div className="text-xs text-white opacity-90">
                            CR: {lecture.classRep}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar for Event Details */}
      <div className="w-72 border-l border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 overflow-y-auto transition-colors duration-200">
        {/* Time and Date Header */}
        <div className="p-5 bg-gradient-to-br from-gray-800 to-gray-950 text-white dark:from-gray-900 dark:to-black">
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-baseline">
              <span className="text-4xl font-bold tracking-tight">{format(selectedDate, 'h:mm')}</span>
              <span className="text-xl text-gray-400 ml-1.5">{format(selectedDate, 'a')}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">{format(selectedDate, 'EEEE')},</div>
              <div className="text-sm font-medium">{format(selectedDate, 'MMMM d')}</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setSelectedDate(prevDate => addDays(prevDate, -1))}
                className="p-1 rounded-full hover:bg-gray-700/50 transition-colors"
              >
                <ChevronLeft className="h-3 w-3 text-gray-400" />
              </button>
              <div className="text-xs font-medium">
                {format(selectedDate, 'MMM d')}
              </div>
              <button 
                onClick={() => setSelectedDate(prevDate => addDays(prevDate, 1))}
                className="p-1 rounded-full hover:bg-gray-700/50 transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-gray-400" />
              </button>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md py-1 px-3 text-xs transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Schedule Lecture</span>
              </button>
              <button className="ml-2 p-1 rounded-full hover:bg-gray-700/50 transition-colors">
                <MoreHorizontal className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Event Details */}
        {selectedEvent && (
          <div className="m-4 mb-3 overflow-hidden rounded-lg border border-gray-700 dark:border-gray-700 transition-colors duration-200">
            <div className="p-4 bg-gray-800/50 dark:bg-gray-800/50">
              <div className={`w-1 h-3 ${selectedEvent.type === 'workshop' ? 'bg-orange-500' : selectedEvent.type === 'lab' ? 'bg-green-500' : 'bg-blue-500'} rounded-full mb-2`}></div>
              <h3 className="font-semibold text-sm text-white mb-1">{selectedEvent.title}</h3>
              <div className="flex items-center text-[10px] text-gray-400 mb-1">
                <span>{format(new Date(selectedEvent.startTime), 'h:mm a')} - {format(new Date(selectedEvent.endTime), 'h:mm a')}</span>
              </div>
              {selectedEvent.description && (
                <p className="text-[11px] text-gray-300 mb-2">{selectedEvent.description}</p>
              )}
              {selectedEvent.location && (
                <div className="flex items-center text-[10px] text-gray-400 mt-2">
                  <div className="w-1 h-1 rounded-full bg-gray-500 mr-1.5"></div>
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.classRep && (
                <div className="flex items-center text-[10px] text-gray-400 mt-1">
                  <div className="w-1 h-1 rounded-full bg-gray-500 mr-1.5"></div>
                  <span>CR: {selectedEvent.classRep}</span>
                </div>
              )}
              {selectedEvent.unit && (
                <div className="flex items-center text-[10px] text-gray-400 mt-1">
                  <div className="w-1 h-1 rounded-full bg-gray-500 mr-1.5"></div>
                  <span>{selectedEvent.unit}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today's Lectures */}
        <div className="px-4 py-2">
          <h3 className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium mb-3">Today's Lectures</h3>
          <div className="space-y-2">
            {events
              .filter(event => isSameDay(new Date(event.startTime), selectedDate))
              .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
              .map(event => (
                <div 
                  key={event.id}
                  className={`group rounded-md overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors ${
                    selectedEvent && selectedEvent.id === event.id 
                      ? 'ring-1 ring-blue-500 dark:ring-blue-400 border-transparent' 
                      : ''
                  }`}
                  onClick={() => handleEventClick(event)}
                >
                  <div className="p-2.5">
                    <div className="flex items-center mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${event.type === 'workshop' ? 'bg-orange-500' : event.type === 'lab' ? 'bg-green-500' : 'bg-blue-500'} mr-1.5`}></div>
                      <span className="text-xs font-medium dark:text-white transition-colors duration-200">{event.title}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 transition-colors duration-200">
                      <span>{format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
              
            {events.filter(event => isSameDay(new Date(event.startTime), selectedDate)).length === 0 && (
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2 transition-colors duration-200">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 transition-colors duration-200">No lectures scheduled for today</p>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="mt-2 text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  Schedule a lecture
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl w-full max-w-2xl shadow-2xl transform transition-all duration-200 scale-100 opacity-100 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Schedule New Lecture
              </h3>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-md">
                <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
            <ScheduleLectureForm
              onClose={() => setShowScheduleModal(false)}
              onSubmit={handleScheduleLecture}
            />
          </div>
        </div>
      )}

      {/* Calendar Bottom Navigation */}
      <div className="fixed bottom-14 md:bottom-2 left-0 right-0 flex justify-center items-center z-40 pointer-events-none">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-xl border border-gray-800 flex items-center space-x-2 max-w-xs mx-auto overflow-hidden pointer-events-auto">
          <button 
            onClick={gotoToday}
            className="text-[10px] px-2 py-1 text-white hover:bg-gray-800 rounded-md transition-colors"
          >
            Today
          </button>
          
          <div className="h-4 border-r border-gray-700"></div>
          
          <button 
            onClick={gotoPrevWeek}
            className="p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </button>
          
          <div className="text-[10px] text-gray-300 font-medium">
            {format(selectedDate, 'MMM d')}
          </div>
          
          <button 
            onClick={gotoNextWeek}
            className="p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
          
          <div className="h-4 border-r border-gray-700"></div>
          
          <button
            onClick={exportWeeklySchedule}
            disabled={isExporting}
            className={`flex items-center gap-1 ${isExporting ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md py-1 px-2 text-[10px] transition-colors`}
            title="Export week schedule to PDF"
          >
            {isExporting ? (
              <>
                <div className="h-3 w-3 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-3 w-3" />
                <span>Export</span>
              </>
            )}
          </button>
          
          <div className="h-4 border-r border-gray-700"></div>
          
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md py-1 px-2 text-[10px] transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarView; 