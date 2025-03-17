import { addDays, eachDayOfInterval, endOfWeek, format, isSameDay, startOfWeek } from 'date-fns';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { BookOpen, Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock, Download, MapPin, MoreHorizontal, Plus, RefreshCw, Search, Settings, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCalendar } from '../../context/CalendarContext';
import { db } from '../../firebase/config';
import { useToast } from '../common/ToastManager';
import ScheduleLectureForm from './ScheduleLectureForm';

const CalendarView = ({ showScheduleModal, setShowScheduleModal }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { selectedDate, setSelectedDate } = useCalendar();
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  
  // Fetch real schedule data from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    
    console.log('Setting up real-time schedule data listener...');
    setLoading(true);
    
    // Create a query to get schedules assigned to this lecturer
    const schedulesQuery = query(
      collection(db, 'schedules'),
      where('lecturerId', '==', user.uid),
      orderBy('date', 'asc')
    );
    
    // Set up real-time listener for schedules
    const unsubscribe = onSnapshot(
      schedulesQuery,
      async (snapshot) => {
        try {
          // Check for changes in the data
          if (!snapshot.empty) {
            setRefreshing(true);
            console.log(`Received ${snapshot.docs.length} schedules from Firestore`);
            
            // Log added documents for debugging
            if (snapshot.docChanges().length > 0) {
              console.log('Changes detected:', snapshot.docChanges().map(change => change.type).join(', '));
              
              // Show a notification for added schedules
              const addedDocs = snapshot.docChanges().filter(change => change.type === 'added');
              if (addedDocs.length > 0 && !loading) {
                showInfo(`Calendar updated with ${addedDocs.length} new schedule(s)`);
              }
            }
          }
          
          const schedulePromises = snapshot.docs.map(async (doc) => {
            const scheduleData = {
              id: doc.id,
              ...doc.data()
            };
            
            // Convert timestamps to Date objects with better error handling
            if (scheduleData.date && typeof scheduleData.date.toDate === 'function') {
              scheduleData.date = scheduleData.date.toDate();
            } else if (scheduleData.date) {
              try {
                scheduleData.date = new Date(scheduleData.date);
                if (isNaN(scheduleData.date.getTime())) {
                  console.warn('Invalid date detected, using current date instead');
                  scheduleData.date = new Date();
                }
              } catch (e) {
                console.error('Error parsing date:', e);
                scheduleData.date = new Date();
              }
            } else {
              scheduleData.date = new Date();
            }
            
            // Create startTime and endTime Date objects for calendar display
            const startHour = scheduleData.startTime?.split(':')[0] || '09';
            const startMinute = scheduleData.startTime?.split(':')[1] || '00';
            const endHour = scheduleData.endTime?.split(':')[0] || '11';
            const endMinute = scheduleData.endTime?.split(':')[1] || '00';
            
            const startDate = new Date(scheduleData.date);
            startDate.setHours(parseInt(startHour, 10), parseInt(startMinute, 10));
            
            const endDate = new Date(scheduleData.date);
            endDate.setHours(parseInt(endHour, 10), parseInt(endMinute, 10));
            
            // Format the event for calendar display
            const eventData = {
              id: scheduleData.id,
              title: scheduleData.title || 'Untitled Lecture',
              description: scheduleData.notes || '',
              startTime: startDate,
              endTime: endDate,
              location: scheduleData.room || 'Not specified',
              classRep: scheduleData.classRep || 'Not assigned',
              type: scheduleData.type || 'lecture',
              color: getLectureColorByType(scheduleData.type),
              unit: scheduleData.unit || '',
              original: scheduleData // Keep the original data for references
            };
            
            return eventData;
          });
          
          const schedulesData = await Promise.all(schedulePromises);
          setEvents(schedulesData);
          console.log('Calendar updated with', schedulesData.length, 'scheduled events');
        } catch (error) {
          console.error('Error processing schedules:', error);
          showError('Error loading calendar: ' + error.message);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      (error) => {
        console.error('Error fetching schedules:', error);
        showError('Failed to connect to schedule database: ' + error.message);
        setLoading(false);
        setRefreshing(false);
      }
    );
    
    // Clean up listener on unmount
    return () => {
      console.log('Cleaning up real-time listener');
      unsubscribe();
    };
  }, [user, showError, showInfo]);
  
  const getLectureColorByType = (type) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-500';
      case 'lab':
        return 'bg-green-500';
      case 'tutorial':
        return 'bg-purple-500';
      case 'workshop':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };
  
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

  // Handle scheduling a new lecture 
  const handleScheduleLecture = async (newLectureData) => {
    try {
      console.log('Received schedule data for scheduling:', newLectureData);
      
      // Check if we have an array of schedules (recurring) or a single schedule
      const isRecurringArray = Array.isArray(newLectureData);
      
      // If it's an array (recurring schedules), process each one
      if (isRecurringArray) {
        console.log('Processing recurring schedules array with', newLectureData.length, 'schedules');
        
        // Process each schedule in the array
        for (const scheduleSingle of newLectureData) {
          await saveIndividualSchedule(scheduleSingle);
        }
        
        // Show success message after all are saved
        showSuccess(`Successfully scheduled ${newLectureData.length} recurring lectures!`);
        return;
      }
      
      // It's a single schedule, process it directly
      await saveIndividualSchedule(newLectureData);
      
      // Show success message
      showSuccess('Lecture scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling lecture:', error);
      showError(`Failed to schedule lecture: ${error.message}`);
    }
  };
  
  // Helper function to save a single schedule to Firestore
  const saveIndividualSchedule = async (newSchedule) => {
    // Validate required fields - ensure we get title as a string
    if (!newSchedule || typeof newSchedule !== 'object') {
      console.error('Invalid schedule data received');
      throw new Error('Invalid schedule data. Please try again.');
    }
    
    // Convert any potential title object to string and validate
    const title = String(newSchedule.title || '').trim();
    if (!title) {
      console.error('Missing required field: title');
      throw new Error('Lecture title is required. Please try again.');
    }

    // Better date handling - log the date we received for debugging
    console.log('Date received in saveIndividualSchedule:', newSchedule.date, 
      typeof newSchedule.date, 
      newSchedule.date instanceof Date);
    
    // Ensure we have a valid Date object  
    let scheduleDate;
    if (newSchedule.date instanceof Date && !isNaN(newSchedule.date.getTime())) {
      // If it's already a valid Date object, use it
      scheduleDate = newSchedule.date;
    } else if (typeof newSchedule.date === 'string' && newSchedule.date.trim() !== '') {
      // If it's a string, try to convert it to a Date
      scheduleDate = new Date(newSchedule.date);
      // If conversion failed, log an error and use current date
      if (isNaN(scheduleDate.getTime())) {
        console.error('Failed to parse date string:', newSchedule.date);
        scheduleDate = new Date();
      }
    } else {
      // If all else fails, use current date but log a warning
      console.warn('No valid date provided, using current date as fallback');
      scheduleDate = new Date();
    }

    // Format data for Firestore with improved date handling
    const scheduleData = {
      title: title,
      topics: Array.isArray(newSchedule.topics) ? newSchedule.topics : [],
      room: newSchedule.room || '',
      // Convert our validated Date to Firestore Timestamp
      date: Timestamp.fromDate(scheduleDate),
      startTime: newSchedule.startTime || '09:00',
      endTime: newSchedule.endTime || '11:00',
      classRep: newSchedule.classRep || '',
      notes: newSchedule.notes || '',
      type: newSchedule.type || 'lecture',
      lecturerId: user.uid,
      createdAt: Timestamp.now()
    };
      
    // If it's not a new schedule, find the course from the existing schedule
    if (!newSchedule.isNewLecture && title) {
      try {
        // Find the existing schedule with this title
        const schedulesQuery = query(
          collection(db, 'schedules'),
          where('title', '==', title),
          where('lecturerId', '==', user.uid)
        );
        
        const schedulesSnapshot = await getDocs(schedulesQuery);
        if (!schedulesSnapshot.empty) {
          // Get the courseId from the existing schedule
          const existingSchedule = schedulesSnapshot.docs[0].data();
          if (existingSchedule.courseId) {
            scheduleData.courseId = existingSchedule.courseId;
          }
        }
      } catch (error) {
        console.error('Error finding existing schedule:', error);
      }
    }
    
    // If we couldn't find courseId from the existing schedule, try to get it from the unit name
    if (!scheduleData.courseId && newSchedule.unit) {
        try {
          const coursesQuery = query(
            collection(db, 'courses'),
          where('name', '==', newSchedule.unit)
          );
          
          const coursesSnapshot = await getDocs(coursesQuery);
          if (!coursesSnapshot.empty) {
          scheduleData.courseId = coursesSnapshot.docs[0].id;
          }
        } catch (error) {
          console.error('Error finding course ID:', error);
        }
      }
      
    // Use courseId directly from the newSchedule if available
    if (!scheduleData.courseId && newSchedule.courseId) {
      scheduleData.courseId = newSchedule.courseId;
    }
    
    // Add the topic from the unit field if it's not already in the topics array
    if (newSchedule.unit && !scheduleData.topics.includes(newSchedule.unit)) {
      scheduleData.topics.push(newSchedule.unit);
    }
    
    // Final validation before saving
    if (!scheduleData.title) {
      console.error('Title is empty after processing');
      throw new Error('Lecture title cannot be empty');
    }
    
    console.log('Saving schedule data to Firestore:', scheduleData);
    
    try {
      // Save to Firestore using the schedules collection
      const docRef = await addDoc(collection(db, 'schedules'), scheduleData);
      console.log('Lecture scheduled successfully with ID:', docRef.id);
      
      return docRef;
    } catch (error) {
      console.error('Error adding schedule document:', error);
      throw new Error(`Database error: ${error.message}`);
    }
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
      doc.text('Lecture Schedule', 148.5, 25, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(dateRangeText, 148.5, 32, { align: 'center' });
      
      // Filter events for the current week
      const eventsForWeek = events.filter(event => {
        const eventDate = new Date(event.startTime);
          const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
          return eventDate >= weekStart && eventDate <= weekEnd;
      }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      
      // Generate the data for the table
      const tableData = eventsForWeek.map(event => {
        const eventDate = new Date(event.startTime);
        return [
          format(eventDate, 'EEEE'),
          format(eventDate, 'dd MMM yyyy'),
          `${format(new Date(event.startTime), 'HH:mm')} - ${format(new Date(event.endTime), 'HH:mm')}`,
          event.title,
          event.unit || '',
          event.location || '',
          event.classRep || ''
        ];
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

  // Add a manual refresh function for fallback
  const refreshCalendar = async () => {
    if (refreshing || !user?.uid) return;
    
    try {
      setRefreshing(true);
      showInfo('Refreshing calendar data...');
      
      const schedulesQuery = query(
        collection(db, 'schedules'),
        where('lecturerId', '==', user.uid),
        orderBy('date', 'asc')
      );
      
      const snapshot = await getDocs(schedulesQuery);
      
      // Process the data manually (similar to onSnapshot logic)
      const schedulePromises = snapshot.docs.map(async (doc) => {
        const scheduleData = { id: doc.id, ...doc.data() };
        
        // Convert timestamps to Date objects
        if (scheduleData.date && typeof scheduleData.date.toDate === 'function') {
          scheduleData.date = scheduleData.date.toDate();
        } else if (scheduleData.date) {
          scheduleData.date = new Date(scheduleData.date);
        } else {
          scheduleData.date = new Date();
        }
        
        // Create startTime and endTime Date objects for calendar display
        const startHour = scheduleData.startTime?.split(':')[0] || '09';
        const startMinute = scheduleData.startTime?.split(':')[1] || '00';
        const endHour = scheduleData.endTime?.split(':')[0] || '11';
        const endMinute = scheduleData.endTime?.split(':')[1] || '00';
        
        const startDate = new Date(scheduleData.date);
        startDate.setHours(parseInt(startHour, 10), parseInt(startMinute, 10));
        
        const endDate = new Date(scheduleData.date);
        endDate.setHours(parseInt(endHour, 10), parseInt(endMinute, 10));
        
        return {
          id: scheduleData.id,
          title: scheduleData.title || 'Untitled Lecture',
          description: scheduleData.notes || '',
          startTime: startDate,
          endTime: endDate,
          location: scheduleData.room || 'Not specified',
          classRep: scheduleData.classRep || 'Not assigned',
          type: scheduleData.type || 'lecture',
          color: getLectureColorByType(scheduleData.type),
          unit: scheduleData.unit || '',
          original: scheduleData
        };
      });
      
      const schedulesData = await Promise.all(schedulePromises);
      setEvents(schedulesData);
      showSuccess('Calendar refreshed successfully');
    } catch (error) {
      console.error('Error manually refreshing calendar:', error);
      showError('Failed to refresh calendar: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle deleting an event
  const handleDeleteEvent = async (eventId) => {
    if (!eventId || !user?.uid) {
      showError('Cannot delete event: Missing event ID or user information');
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Confirm deletion with user
      if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        setIsDeleting(false);
        return;
      }
      
      // Get a reference to the document
      const eventDocRef = doc(db, 'schedules', eventId);
      
      // Delete the document
      await deleteDoc(eventDocRef);
      
      // Update UI by removing the event from state
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      // Clear selected event if it was the one deleted
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(null);
      }
      
      showSuccess('Event successfully deleted');
      console.log('Event deleted:', eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
      showError('Failed to delete event: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle editing an event
  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setIsEditing(true);
  };

  // Handle saving edited event
  const handleSaveEdit = async (updatedEventData) => {
    if (!eventToEdit || !user?.uid) {
      showError('Cannot update event: Missing event ID or user information');
      return;
    }
    
    try {
      console.log('Updating event with data:', updatedEventData);
      
      // Log the date we received for debugging
      console.log('Date received in handleSaveEdit:', updatedEventData.date, 
        typeof updatedEventData.date, 
        updatedEventData.date instanceof Date);
      
      // Better date handling for updates
      let eventDate;
      if (updatedEventData.date instanceof Date && !isNaN(updatedEventData.date.getTime())) {
        // If it's already a valid Date object, use it
        eventDate = updatedEventData.date;
      } else if (typeof updatedEventData.date === 'string' && updatedEventData.date.trim() !== '') {
        // If it's a string, try to convert it to a Date
        eventDate = new Date(updatedEventData.date);
        // If conversion failed, log an error and use the original event date
        if (isNaN(eventDate.getTime())) {
          console.error('Failed to parse date string:', updatedEventData.date);
          // Fall back to the original event date if possible
          eventDate = new Date(eventToEdit.startTime);
        }
      } else {
        // If all else fails, use the original event date
        console.warn('No valid date provided for update, using original event date');
        eventDate = new Date(eventToEdit.startTime);
      }
      
      // Get a reference to the document
      const eventDocRef = doc(db, 'schedules', eventToEdit.id);
      
      // Format the data for Firestore with better date handling
      const eventData = {
        title: updatedEventData.title || '',
        room: updatedEventData.room || '',
        // Use our properly validated date
        date: Timestamp.fromDate(eventDate),
        startTime: updatedEventData.startTime || '09:00',
        endTime: updatedEventData.endTime || '11:00',
        classRep: updatedEventData.classRep || '',
        notes: updatedEventData.notes || '',
        type: updatedEventData.type || 'lecture',
        // Only update if we have a value, otherwise keep existing
        ...(updatedEventData.unit && { unit: updatedEventData.unit }),
        // Add timestamp for the update
        updatedAt: Timestamp.now()
      };
      
      console.log('Sending update to Firestore with date:', eventDate);
      
      // Update the document in Firestore
      await updateDoc(eventDocRef, eventData);
      
      // Close the edit form
      setIsEditing(false);
      setEventToEdit(null);
      
      // Update selected event with new data (the real-time listener will handle the full update)
      if (selectedEvent && selectedEvent.id === eventToEdit.id) {
        // Temporarily update the selected event until the listener refreshes the data
        const updatedEvent = {
          ...selectedEvent,
          title: eventData.title,
          location: eventData.room,
          description: eventData.notes,
          classRep: eventData.classRep,
          type: eventData.type,
          unit: updatedEventData.unit || selectedEvent.unit
        };
        setSelectedEvent(updatedEvent);
      }
      
      showSuccess('Event successfully updated');
      console.log('Event updated:', eventToEdit.id);
    } catch (error) {
      console.error('Error updating event:', error);
      showError('Failed to update event: ' + error.message);
    }
  };
  
  // Close edit form
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEventToEdit(null);
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
            
            {/* Add refresh button */}
            <button 
              onClick={refreshCalendar}
              disabled={refreshing}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 
                         transition-all duration-200 relative"
              title="Refresh calendar"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-blue-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
              {refreshing && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse-custom"></span>
              )}
            </button>
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
        
        {/* Show loading/refreshing indicators */}
        {(loading || refreshing) && (
          <div className="absolute top-16 right-4 z-40 flex items-center space-x-1 py-1 px-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-md shadow-md border border-blue-200 dark:border-blue-800">
            <div className="animate-spin h-3 w-3 border-b-2 border-current rounded-full"></div>
            <span>{loading ? 'Loading calendar...' : 'Refreshing data...'}</span>
          </div>
        )}
        
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
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar for Event Details - UPDATED FOR INDEPENDENT SCROLLING */}
      <div className="w-72 border-l border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-800 transition-colors duration-200 h-full overflow-hidden">
        {/* Fixed header section - doesn't scroll */}
        <div className="p-5 bg-gradient-to-br from-indigo-800 to-blue-900 text-white dark:from-indigo-900 dark:to-blue-950 relative flex-shrink-0">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-70"></div>
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-baseline">
              <span className="text-4xl font-bold tracking-tight">{format(selectedDate, 'h:mm')}</span>
              <span className="text-xl text-blue-200 ml-1.5">{format(selectedDate, 'a')}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-200">{format(selectedDate, 'EEEE')},</div>
              <div className="text-sm font-medium">{format(selectedDate, 'MMMM d')}</div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setSelectedDate(prevDate => addDays(prevDate, -1))}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="h-3 w-3 text-blue-200" />
              </button>
              <div className="text-xs font-medium">
                {format(selectedDate, 'MMM d')}
              </div>
              <button 
                onClick={() => setSelectedDate(prevDate => addDays(prevDate, 1))}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="h-3 w-3 text-blue-200" />
              </button>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white rounded-md py-1 px-3 text-xs transition-colors backdrop-blur-sm"
              >
                <Plus className="h-3 w-3" />
                <span>Schedule Lecture</span>
              </button>
              <button className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors">
                <MoreHorizontal className="h-3.5 w-3.5 text-blue-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content section */}
        <div className="flex-1 overflow-y-auto">
          {/* Selected Event Details - now in the scrollable section */}
          {selectedEvent && !isEditing && (
            <div className="m-4 mb-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-200 hover:shadow-lg">
              <div className="relative p-4 bg-white dark:bg-gray-800">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  selectedEvent.type === 'workshop' ? 'bg-orange-500' : 
                  selectedEvent.type === 'lab' ? 'bg-green-500' : 
                  selectedEvent.type === 'tutorial' ? 'bg-purple-500' : 
                  'bg-blue-500'
                }`}></div>
                
                <div className="pl-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span className={`uppercase text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded ${
                        selectedEvent.type === 'workshop' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 
                        selectedEvent.type === 'lab' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                        selectedEvent.type === 'tutorial' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {selectedEvent.type}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {/* Edit button */}
                      <button
                        onClick={() => handleEditEvent(selectedEvent)}
                        className="text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400 transition-colors p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Edit event"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete event"
                      >
                        {isDeleting ? (
                          <div className="h-4 w-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-2">{selectedEvent.title}</h3>
                  
                  <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mb-3 bg-gray-50 dark:bg-gray-700/30 py-1 px-2 rounded-sm">
                    <Clock className="h-3 w-3 mr-1 text-gray-400 dark:text-gray-500" />
                    <span>{format(new Date(selectedEvent.startTime), 'h:mm a')} - {format(new Date(selectedEvent.endTime), 'h:mm a')}</span>
                  </div>
                  
                  {selectedEvent.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{selectedEvent.description}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {selectedEvent.location && (
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                    
                    {selectedEvent.classRep && (
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-2">
                          <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span>Class Rep: {selectedEvent.classRep}</span>
                      </div>
                    )}
                    
                    {selectedEvent.unit && (
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-2">
                          <BookOpen className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span>{selectedEvent.unit}</span>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {/* Edit button */}
                      <button
                        onClick={() => handleEditEvent(selectedEvent)}
                        className="flex items-center justify-center text-xs py-2 px-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        disabled={isDeleting}
                        className="flex items-center justify-center text-xs py-2 px-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-md transition-colors"
                      >
                        {isDeleting ? (
                          <>
                            <div className="h-3 w-3 border-2 border-red-300 border-t-red-500 rounded-full animate-spin mr-2"></div>
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Event Form - now in the scrollable section */}
          {isEditing && eventToEdit && (
            <div className="m-4 mb-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 shadow-md transition-all duration-200">
              <div className="p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Edit Lecture
                  </h3>
                  <button 
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <ScheduleLectureForm
                  onClose={handleCancelEdit}
                  onSubmit={handleSaveEdit}
                  lectureToEdit={{
                    id: eventToEdit.id,
                    title: eventToEdit.title,
                    // Ensure we have a valid Date object for the date
                    date: new Date(eventToEdit.startTime),
                    startTime: format(new Date(eventToEdit.startTime), 'HH:mm'),
                    endTime: format(new Date(eventToEdit.endTime), 'HH:mm'),
                    room: eventToEdit.location,
                    classRep: eventToEdit.classRep,
                    notes: eventToEdit.description,
                    type: eventToEdit.type,
                    unit: eventToEdit.unit,
                    topics: eventToEdit.original?.topics || [],
                    // Add additional metadata to help debugging
                    originalEventDate: format(new Date(eventToEdit.startTime), 'yyyy-MM-dd'),
                    isEdit: true
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Today's Lectures - now in the scrollable section */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-850">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Today's Lectures</h3>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700 ml-2"></div>
            </div>
            
            <div className="space-y-2.5">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400"></div>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Loading today's lectures...</span>
                </div>
              ) : (
                events
                  .filter(event => isSameDay(new Date(event.startTime), new Date()))
                    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                    .map(event => (
                      <div 
                        key={event.id}
                        className={`group rounded-lg overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all bg-white dark:bg-gray-800 shadow-sm hover:shadow-md ${
                          selectedEvent && selectedEvent.id === event.id 
                            ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-transparent scale-[1.02]' 
                            : ''
                        }`}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="p-3 relative">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            event.type === 'workshop' ? 'bg-orange-500' : 
                            event.type === 'lab' ? 'bg-green-500' : 
                            event.type === 'tutorial' ? 'bg-purple-500' : 
                            'bg-blue-500'
                          }`}></div>
                          
                          <div className="pl-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-800 dark:text-white transition-colors duration-200">
                                {event.title}
                              </span>
                              <span className={`text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                                event.type === 'workshop' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : 
                                event.type === 'lab' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                event.type === 'tutorial' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {event.type}
                              </span>
                            </div>
                            
                            <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200 mt-1.5">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1.5 text-gray-400 dark:text-gray-500" />
                                <span>{format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}</span>
                              </div>
                              <div className="flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1.5 text-gray-400 dark:text-gray-500" />
                                <span>{event.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
              )}
              
              {!loading && events.filter(event => isSameDay(new Date(event.startTime), new Date())).length === 0 && (
                <div className="py-8 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3">
                    <Calendar className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No lectures scheduled for today</p>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="mt-1 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 rounded-md transition-colors duration-200"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    Schedule a lecture
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && !isEditing && (
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
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-full px-2 py-1.5 shadow-xl border border-gray-800 flex items-center space-x-2 max-w-lg mx-auto overflow-hidden pointer-events-auto">
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