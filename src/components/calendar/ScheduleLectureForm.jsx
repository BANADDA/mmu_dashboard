import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { Plus, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import ConfirmDialog from '../common/ConfirmDialog';

const ScheduleLectureForm = ({ onClose, onSubmit, lectureToEdit = null }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    unit: '',
    type: 'lecture',
    room: '',
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    classRep: '',
    notes: '',
    topics: [],
    isRecurring: false,
    recurringPattern: 'weekly',
    recurringCount: 4, // Default to 4 occurrences
    status: 'scheduled'
  });

  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [isCreatingNewLecture, setIsCreatingNewLecture] = useState(false);
  const [newLectureTitle, setNewLectureTitle] = useState('');

  // Data for form selects
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  // Used to track the current course ID for fetching topics and for Firestore operations
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [lecturerLectures, setLecturerLectures] = useState([]);

  const lectureTypes = [
    { id: 1, name: 'Lecture', value: 'lecture' },
    { id: 2, name: 'Lab', value: 'lab' },
    { id: 3, name: 'Tutorial', value: 'tutorial' },
    { id: 4, name: 'Workshop', value: 'workshop' }
  ];

  const recurringPatterns = [
    { id: 1, name: 'Daily', value: 'daily' },
    { id: 2, name: 'Weekly', value: 'weekly' },
    { id: 3, name: 'Bi-weekly', value: 'biweekly' },
    { id: 4, name: 'Monthly', value: 'monthly' }
  ];

  // Check if we're editing and populate form
  useEffect(() => {
    if (lectureToEdit) {
      // Deep copy to prevent modifying the original object
      const editData = JSON.parse(JSON.stringify(lectureToEdit));
      
      // Format the date if it's a timestamp
      if (editData.date && typeof editData.date.toDate === 'function') {
        const dateObj = editData.date.toDate();
        editData.date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
      } else if (editData.date && editData.date instanceof Date) {
        editData.date = editData.date.toISOString().split('T')[0];
      }
      
      // Set topics as array if undefined
      if (!editData.topics) {
        editData.topics = [];
      }

      // Calculate status based on date and time
      editData.status = calculateLectureStatus(editData);
      
      setFormData(editData);
      if (editData.courseId) {
        setSelectedCourseId(editData.courseId);
      }
    }
  }, [lectureToEdit]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCourses(),
          fetchRooms(),
          fetchStudents(),
          fetchLecturerLectures()
        ]);
      } catch (error) {
        console.error('Error fetching form data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch lecture topics when course changes
  useEffect(() => {
    if (selectedCourseId) {
      fetchTopicsForCourse(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Filter students when courseId changes
  useEffect(() => {
    if (selectedCourseId && students.length > 0) {
      const relatedStudents = students.filter(student => 
        student.courseId === selectedCourseId
      );
      setFilteredStudents(relatedStudents.length > 0 ? relatedStudents : students);
    } else {
      setFilteredStudents(students);
    }
  }, [selectedCourseId, students]);

  // Calculate lecture status based on date and time
  const calculateLectureStatus = (lecture) => {
    const now = new Date();
    const lectureDate = new Date(lecture.date);
    
    // Set hours and minutes from the lecture time
    if (lecture.startTime && lecture.endTime) {
      const [startHour, startMinute] = lecture.startTime.split(':').map(Number);
      const [endHour, endMinute] = lecture.endTime.split(':').map(Number);
      
      const startDateTime = new Date(lectureDate);
      startDateTime.setHours(startHour, startMinute);
      
      const endDateTime = new Date(lectureDate);
      endDateTime.setHours(endHour, endMinute);
      
      if (now < startDateTime) {
        return 'scheduled';
      } else if (now >= startDateTime && now <= endDateTime) {
        return 'ongoing';
      } else {
        return 'completed';
      }
    }
    
    // If no time information, just check the date
    if (lectureDate.toDateString() === now.toDateString()) {
      return 'ongoing';
    } else if (lectureDate < now) {
      return 'completed';
    }
    
    return 'scheduled';
  };

  // Fetch topics for selected course
  const fetchTopicsForCourse = async (courseId) => {
    if (!courseId) return;
    
    try {
      // Query lectures for this course to gather topics
      const lecturesQuery = query(
        collection(db, 'lectures'),
        where('courseId', '==', courseId)
      );
      
      const lecturesSnapshot = await getDocs(lecturesQuery);
      
      // Extract and deduplicate topics from lectures
      const topics = new Set();
      lecturesSnapshot.docs.forEach(doc => {
        const lectureData = doc.data();
        if (lectureData.topics && Array.isArray(lectureData.topics)) {
          lectureData.topics.forEach(topic => {
            if (topic) topics.add(topic);
          });
        }
      });
      
      // Also query schedules as they might have additional topics
      const schedulesQuery = query(
        collection(db, 'schedules'),
        where('courseId', '==', courseId)
      );
      
      const schedulesSnapshot = await getDocs(schedulesQuery);
      
      // Add topics from schedules
      schedulesSnapshot.docs.forEach(doc => {
        const scheduleData = doc.data();
        if (scheduleData.topics && Array.isArray(scheduleData.topics)) {
          scheduleData.topics.forEach(topic => {
            if (topic) topics.add(topic);
          });
        }
      });
      
      setAvailableTopics(Array.from(topics));
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  // Fetch courses assigned to the lecturer
  const fetchCourses = async () => {
    try {
      if (!user?.uid) return;

      const courseIds = new Set();
      
      // First get all lectures assigned to this lecturer
      const lecturesQuery = query(
        collection(db, 'lectures'),
        where('lecturerId', '==', user.uid)
      );
      
      const lecturesSnapshot = await getDocs(lecturesQuery);
      
      // Extract course IDs from lectures
      lecturesSnapshot.docs.forEach(doc => {
        const lectureData = doc.data();
        if (lectureData.courseId) {
          courseIds.add(lectureData.courseId);
        }
      });
      
      // Also get all schedules assigned to this lecturer
      const schedulesQuery = query(
        collection(db, 'schedules'),
        where('lecturerId', '==', user.uid)
      );
      
      const schedulesSnapshot = await getDocs(schedulesQuery);
      
      // Extract course IDs from schedules
      schedulesSnapshot.docs.forEach(doc => {
        const scheduleData = doc.data();
        if (scheduleData.courseId) {
          courseIds.add(scheduleData.courseId);
        }
      });
      
      // Fetch details for each course
      const coursesData = [];
      for (const courseId of courseIds) {
        const courseQuery = query(
          collection(db, 'courses'),
          where('id', '==', courseId)
        );
        
        const courseSnapshot = await getDocs(courseQuery);
        courseSnapshot.docs.forEach(doc => {
          coursesData.push({
            id: doc.id,
            ...doc.data(),
            color: getColorForCourse(doc.data().name)
          });
        });
      }
      
      // If lecturer has no assigned courses yet, fetch all active courses
      if (coursesData.length === 0) {
        const allCoursesQuery = query(
          collection(db, 'courses'),
          where('active', '==', true)
        );
        
        const allCoursesSnapshot = await getDocs(allCoursesQuery);
        allCoursesSnapshot.docs.forEach(doc => {
          coursesData.push({
            id: doc.id,
            ...doc.data(),
            color: getColorForCourse(doc.data().name)
          });
        });
      }
 
      console.log('Fetched courses:', coursesData);
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // Fetch available rooms
  const fetchRooms = async () => {
    try {
      // Simplify query to avoid requiring a composite index
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('active', '==', true)
      );
      
      const roomsSnapshot = await getDocs(roomsQuery);
      const roomsData = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        name: `${doc.data().building || 'Building'} - Room ${doc.data().number || 'Unknown'}`
      }));

      // Sort rooms client-side instead of using orderBy in query
      roomsData.sort((a, b) => {
        // First sort by building
        if (a.building !== b.building) {
          return a.building?.localeCompare(b.building) || 0;
        }
        // Then by number
        return a.number?.localeCompare(b.number) || 0;
      });

      // If no rooms in database, use defaults
      if (roomsData.length === 0) {
        const defaultRooms = [
          { id: 1, name: 'Block A - Room 101', building: 'Block A', number: '101' },
          { id: 2, name: 'Block A - Room 102', building: 'Block A', number: '102' },
          { id: 3, name: 'Block B - Lab 201', building: 'Block B', number: '201' },
          { id: 4, name: 'Block B - Lab 203', building: 'Block B', number: '203' },
          { id: 5, name: 'Block C - Room 301', building: 'Block C', number: '301' },
          { id: 6, name: 'Block C - Room 305', building: 'Block C', number: '305' }
        ];
        setRooms(defaultRooms);
        
        // Set default form room if not editing
        if (!formData.room && !lectureToEdit) {
          setFormData(prev => ({
            ...prev,
            room: defaultRooms[0].name
          }));
        }
      } else {
        setRooms(roomsData);
        
        // Set default form room if not editing
        if (roomsData.length > 0 && !formData.room && !lectureToEdit) {
          setFormData(prev => ({
            ...prev,
            room: roomsData[0].name
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Fallback to default rooms
      const defaultRooms = [
        { id: 1, name: 'Block A - Room 101' },
        { id: 2, name: 'Block A - Room 102' },
        { id: 3, name: 'Block B - Lab 201' },
        { id: 4, name: 'Block B - Lab 203' },
        { id: 5, name: 'Block C - Room 301' },
        { id: 6, name: 'Block C - Room 305' }
      ];
      setRooms(defaultRooms);
      
      // Set default form room if not editing
      if (!formData.room && !lectureToEdit) {
        setFormData(prev => ({
          ...prev,
          room: defaultRooms[0].name
        }));
      }
    }
  };

  // Fetch students who could be class representatives
  const fetchStudents = async () => {
    try {
      const studentsQuery = query(
        collection(db, 'students'),
        orderBy('name')
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If no students in database, use defaults
      if (studentsData.length === 0) {
        const defaultStudents = [
          { id: 1, name: 'John Doe', courseId: null, course: 'Software Engineering' },
          { id: 2, name: 'Jane Smith', courseId: null, course: 'Database Systems' },
          { id: 3, name: 'Mike Johnson', courseId: null, course: 'Web Development' },
          { id: 4, name: 'Sarah Williams', courseId: null, course: 'Operating Systems' },
          { id: 5, name: 'Alex Johnson', courseId: null, course: 'Computer Networks' },
          { id: 6, name: 'Robert Chen', courseId: null, course: 'Mobile Development' },
          { id: 7, name: 'Emily Parker', courseId: null, course: 'Algorithms and Data Structures' }
        ];
        setStudents(defaultStudents);
        setFilteredStudents(defaultStudents);
      } else {
        // For each student, get their course name if courseId exists
        for (let student of studentsData) {
          if (student.courseId) {
            try {
              // Get course name for display
              const courseQuery = query(
                collection(db, 'courses'),
                where('id', '==', student.courseId)
              );
              const courseSnapshot = await getDocs(courseQuery);
              if (!courseSnapshot.empty) {
                student.course = courseSnapshot.docs[0].data().name;
              }
            } catch (err) {
              console.error('Error fetching course for student:', err);
            }
          }
        }
        
        setStudents(studentsData);
        setFilteredStudents(studentsData);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Get color for course based on name
  const getColorForCourse = (courseName) => {
    if (!courseName) return 'bg-blue-500';
    
    const colors = {
      'Software Engineering': 'bg-blue-500',
      'Database Systems': 'bg-green-500',
      'Web Development': 'bg-purple-500',
      'Computer Networks': 'bg-orange-500',
      'Operating Systems': 'bg-teal-500',
      'Algorithms': 'bg-pink-500',
      'Data Structures': 'bg-pink-500',
      'Mobile Development': 'bg-indigo-500'
    };
    
    // Look for partial matches
    for (const [key, value] of Object.entries(colors)) {
      if (courseName.includes(key)) {
        return value;
      }
    }
    
    // Return a default color or random color based on string
    const hashCode = courseName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colors6 = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500'];
    return colors6[Math.abs(hashCode) % colors6.length];
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle special case for lecture title dropdown
    if (name === 'title' && value === 'create_new') {
      setIsCreatingNewLecture(true);
      return;
    }
    
    // Add debug log for lecture selection
    if (name === 'title' && value !== '') {
      console.log('Selected lecture title:', value);
      // Find the selected lecture to get its courseId
      const selectedLecture = lecturerLectures.find(lecture => lecture.title === value);
      if (selectedLecture) {
        console.log('Found lecture data:', selectedLecture);
        
        // If the lecture has a courseId, set it and find the corresponding course
        if (selectedLecture.courseId) {
          setSelectedCourseId(selectedLecture.courseId);
          
          // Try to find course name for reference, but don't require it
          const course = courses.find(c => c.id === selectedLecture.courseId);
          if (course) {
            console.log('Found corresponding course:', course);
          }
        }
        
        // Update form with lecture title and keep any existing topics
        setFormData(prev => ({
          ...prev,
          title: value,
          // Keep the original topics from the selected lecture if available
          topics: selectedLecture.topics || prev.topics || []
        }));
        return;
      }
    }
    
    // Special handling for date field to ensure proper format
    if (name === 'date') {
      console.log('Date changed:', value, typeof value);
      
      // Ensure date is in proper yyyy-MM-dd format for the input field
      let formattedDate = value;
      
      // Store the date as both string (for display) and Date object (for processing)
      setFormData(prev => ({
        ...prev,
        [name]: formattedDate,
        dateObject: value ? new Date(value) : null // Store as Date object for submission
      }));
      
      console.log('Updated form date state:', formattedDate, 'Date object:', value ? new Date(value) : null);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle new lecture title input
  const handleNewLectureTitleChange = (e) => {
    setNewLectureTitle(e.target.value);
  };

  // Handle confirming the new lecture
  const handleConfirmNewLecture = () => {
    const title = newLectureTitle.trim();
    if (!title) {
      alert('Please enter a title for the new lecture');
      return;
    }
    
    // Check for duplicate titles
    if (lecturerLectures.some(lecture => lecture.title.toLowerCase() === title.toLowerCase())) {
      alert('A lecture with this title already exists. Please choose a different title.');
      return;
    }
    
    // Set the new lecture title in form data
    setFormData(prev => ({
      ...prev,
      title: title
    }));
    
    // If we don't have a course ID selected yet, and we have courses available,
    // prompt to select a course for this new lecture
    if (!selectedCourseId && courses.length > 0) {
      // Use the first course as default
      setSelectedCourseId(courses[0].id);
      alert(`New lecture "${title}" will be associated with the course "${courses[0].name}". You can change this later.`);
    }
    
    setIsCreatingNewLecture(false);
    setNewLectureTitle('');
    console.log('New lecture title set:', title);
  };

  // Handle canceling the new lecture creation
  const handleCancelNewLecture = () => {
    setIsCreatingNewLecture(false);
    setNewLectureTitle('');
    
    // Reset to first lecture if available, otherwise leave empty
    if (lecturerLectures.length > 0) {
      setFormData(prev => ({
        ...prev,
        title: lecturerLectures[0].title
      }));
    }
  };

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    
    // Add topic to form data
    setFormData(prev => ({
      ...prev,
      topics: [...(prev.topics || []), newTopic.trim()]
    }));
    
    // Reset new topic input
    setNewTopic('');
    setIsAddingTopic(false);
  };

  const handleRemoveTopic = (topicToRemove) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }));
  };

  const handleTopicSelect = (topic) => {
    if (!formData.topics?.includes(topic)) {
      setFormData(prev => ({
        ...prev,
        topics: [...(prev.topics || []), topic]
      }));
    }
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Make sure we have minimum required data
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Validate title is not empty
    if (!formData.title.trim()) {
      alert('Lecture title cannot be empty');
      return;
    }
    
    // Make sure date is valid
    if (!formData.date || isNaN(new Date(formData.date).getTime())) {
      alert('Please select a valid date');
      return;
    }
    
    // Make sure we have a course ID
    if (!selectedCourseId && !lecturerLectures.find(l => l.title === formData.title)?.courseId) {
      alert('Please select a valid lecture with a course association');
      return;
    }

    // Show confirmation dialog instead of immediately submitting
    setShowConfirmDialog(true);
  };

  // Function to handle the actual submission after confirmation
  const handleConfirmedSubmit = async () => {
    // Set submitting state to show loading
    setSubmitting(true);
    
    try {
      // Find the existing lecture we're scheduling
      const existingLecture = lecturerLectures.find(l => l.title === formData.title);
      const courseId = existingLecture?.courseId || selectedCourseId;
      
      // Look up course details for color
      const selectedCourse = courses.find(course => course.id === courseId);
      const courseColor = selectedCourse?.color || 'bg-blue-500'; 
      
      console.log('Submitting schedule with lecture:', {
        title: formData.title,
        courseId: courseId,
        existingLecture: existingLecture ? existingLecture.id : 'none',
        isNewLecture: !existingLecture
      });
      
      // Enhanced date handling for submission
      let submitDate;
      
      // Check if we have a dateObject from the date input handling
      if (formData.dateObject instanceof Date && !isNaN(formData.dateObject.getTime())) {
        console.log('Using dateObject for submission:', formData.dateObject);
        submitDate = formData.dateObject;
      } 
      // Try to parse the string date
      else if (typeof formData.date === 'string' && formData.date.trim()) {
        submitDate = new Date(formData.date);
        console.log('Parsed date from string:', submitDate);
        
        // If parsing failed, use current date with warning
        if (isNaN(submitDate.getTime())) {
          console.warn('Failed to parse date string, using current date');
          submitDate = new Date();
        }
      } 
      // If all else fails, use current date
      else {
        console.warn('No valid date found, using current date');
        submitDate = new Date();
      }
      
      // Format the schedule data for submission with proper date
      const scheduleData = {
        ...formData,
        color: courseColor,
        id: formData.id || Date.now(),
        type: formData.type || 'lecture',
        courseId: courseId,
        status: calculateLectureStatus(formData),
        isNewLecture: !existingLecture,
        lecturerId: user.uid,
        // Use our prepared date object
        date: submitDate
      };
      
      console.log('Final submission date:', submitDate);
      
      // If the existing lecture has topics, include them
      if (existingLecture?.topics && Array.isArray(existingLecture.topics)) {
        // Combine existing topics with any new ones from the form
        const allTopics = new Set([...existingLecture.topics, ...(formData.topics || [])]);
        scheduleData.topics = Array.from(allTopics);
      }
      
      // Include the course name as a topic if available
      if (selectedCourse?.name && scheduleData.topics && !scheduleData.topics.includes(selectedCourse.name)) {
        scheduleData.topics = [...(scheduleData.topics || []), selectedCourse.name];
      }
      
      console.log('Submitting schedule data:', scheduleData);
      
      // Create recurring schedules if needed
      if (formData.isRecurring && !lectureToEdit) {
        console.log('Creating recurring schedules...');
        const recurringSchedules = generateRecurringLectures(scheduleData);
        console.log('Generated recurring schedules:', recurringSchedules);
        await onSubmit(recurringSchedules);
      } else {
        // Send single schedule data to parent component
        await onSubmit(scheduleData);
      }
      
      // Close the form after successful submission
      onClose();
    } catch (error) {
      console.error('Error submitting lecture form:', error);
      alert(`Error scheduling lecture: ${error.message || 'Please try again.'}`);
    } finally {
      // Always reset the submitting state, even if there's an error
      setSubmitting(false);
    }
  };

  // Generate multiple lecture instances for recurring lectures
  const generateRecurringLectures = (baseLecture) => {
    const lectures = [baseLecture];
    const pattern = formData.recurringPattern;
    const count = formData.recurringCount;
    
    if (!count || count < 1) return lectures;
    
    // Start with the base lecture date - ensure we have a proper Date object
    let baseDate;
    if (typeof formData.date === 'string') {
      baseDate = new Date(formData.date);
    } else if (formData.date instanceof Date) {
      baseDate = new Date(formData.date);
    } else {
      console.error('Invalid date format for recurring lectures');
      return lectures;
    }
    
    // Make sure date is valid
    if (isNaN(baseDate.getTime())) {
      console.error('Invalid date for recurring lectures');
      return lectures;
    }
    
    let currentDate = new Date(baseDate);
    
    // Generate additional lecture dates based on pattern
    for (let i = 1; i < count; i++) {
      let nextDate;
      
      switch (pattern) {
        case 'daily':
          nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'monthly':
          nextDate = new Date(currentDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        default:
          nextDate = new Date(currentDate);
          nextDate.setDate(nextDate.getDate() + 7); // Default to weekly
      }
      
      currentDate = nextDate;
      
      // Create a new lecture with the new date
      const newLecture = {
        ...baseLecture,
        date: currentDate,
        id: Date.now() + i, // Ensure unique IDs
        status: 'scheduled' // All future lectures are scheduled
      };
      
      lectures.push(newLecture);
    }
    
    console.log(`Generated ${lectures.length} recurring lectures`);
    return lectures;
  };

  // Fetch lectures assigned to the current lecturer
  const fetchLecturerLectures = async () => {
    try {
      if (!user?.uid) return;
      
      // Query to get all lectures assigned to this lecturer from the lectures collection
      const lecturesQuery = query(
        collection(db, 'lectures'),
        where('lecturerId', '==', user.uid)
      );
      
      const lecturesSnapshot = await getDocs(lecturesQuery);
      
      // Extract lecture data
      const lecturerLecturesData = lecturesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Fetched lectures from lectures collection:', lecturerLecturesData);
      setLecturerLectures(lecturerLecturesData);
      
      // If editing, no need to set default
      if (lectureToEdit) return;
      
      // Set default lecture title if available
      if (lecturerLecturesData.length > 0 && !formData.title) {
        setFormData(prev => ({
          ...prev,
          title: lecturerLecturesData[0].title
        }));
        
        // Set courseId for this lecture
        if (lecturerLecturesData[0].courseId) {
          setSelectedCourseId(lecturerLecturesData[0].courseId);
        }
      }
    } catch (error) {
      console.error('Error fetching lecturer lectures:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={onClose}
        className="absolute right-0 top-0 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      
      <form onSubmit={handleSubmit} className="space-y-3 mt-1">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
            Lecture Title
          </label>
          {isCreatingNewLecture ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newLectureTitle}
                onChange={handleNewLectureTitleChange}
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                         text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                         focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new lecture title"
                autoFocus
              />
              <button
                type="button"
                onClick={handleConfirmNewLecture}
                className="px-2 py-1.5 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add
              </button>
              <button
                type="button"
                onClick={handleCancelNewLecture}
                className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                         rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <select
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                     text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                     focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="" disabled>Select a Lecture</option>
              <option value="create_new">➕ Create New Lecture</option>
              {lecturerLectures.length > 0 ? (
                lecturerLectures.map(lecture => (
                  <option key={lecture.id} value={lecture.title}>
                    {lecture.title}
                  </option>
                ))
              ) : (
                <option disabled>No existing lectures available</option>
              )}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
              Lecture Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                       text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                       focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {lectureTypes.map(type => (
                <option key={type.id} value={type.value}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
            Room
          </label>
          <select
            name="room"
            value={formData.room}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                     text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                     focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="" disabled>Select a Room</option>
            {rooms.map(room => (
              <option key={room.id} value={room.name}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                       text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                       focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
              Start
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                       text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                       focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
              End
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                       text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                       focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
            Lecture Topics
          </label>
          
          {/* Selected Topics */}
          <div className="flex flex-wrap gap-1 mb-2">
            {formData.topics && formData.topics.length > 0 ? (
              formData.topics.map(topic => (
                <div 
                  key={topic}
                  className="flex items-center bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300"
                >
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  <span>{topic}</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveTopic(topic)}
                    className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    &times;
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs italic text-gray-500 dark:text-gray-400">
                No topics selected
              </div>
            )}
          </div>
          
          {/* Add New Topic Section */}
          {isAddingTopic ? (
            <div className="flex mt-1">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Enter new topic"
                className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-l-md"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded-r-md"
              >
                Add
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 mt-1">
              {/* Available topics from other lectures */}
              {availableTopics.length > 0 && (
                <div className="w-full">
                  <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                    Existing topics:
                  </label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {availableTopics
                      .filter(topic => !formData.topics?.includes(topic))
                      .map(topic => (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => handleTopicSelect(topic)}
                          className="flex items-center bg-gray-100 text-gray-800 text-xs px-1.5 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Plus className="h-2.5 w-2.5 mr-1" />
                          {topic}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setIsAddingTopic(true)}
                className="flex items-center mt-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add New Topic
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
            Class Representative
          </label>
          <select
            name="classRep"
            value={formData.classRep}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                     text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                     focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a Class Representative</option>
            {filteredStudents.map(student => (
              <option key={student.id} value={student.name}>
                {student.name}{student.course ? ` - ${student.course}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                     text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                     focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional information about the lecture..."
          ></textarea>
        </div>

        {!lectureToEdit && (
          <div className="space-y-2 border-t pt-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isRecurring"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleChange}
            className="h-3 w-3 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isRecurring" className="ml-1.5 block text-xs text-gray-700 dark:text-gray-300">
            Recurring Lecture
          </label>
              </div>
              
              {formData.isRecurring && (
                <div className="flex items-center space-x-1">
                  <label htmlFor="recurringCount" className="text-[10px] text-gray-500 dark:text-gray-400">
                    Repeat
                  </label>
                  <input
                    type="number"
                    id="recurringCount"
                    name="recurringCount"
                    min="1"
                    max="52"
                    value={formData.recurringCount}
                    onChange={handleChange}
                    className="w-12 px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">times</span>
                </div>
              )}
        </div>

        {formData.isRecurring && (
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
              Recurrence Pattern
            </label>
            <select
              name="recurringPattern"
              value={formData.recurringPattern}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                       text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                       focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
                  {recurringPatterns.map(pattern => (
                    <option key={pattern.id} value={pattern.value}>
                      {pattern.name}
                    </option>
                  ))}
            </select>
                
                <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 italic">
                  This will create {formData.recurringCount} {formData.recurringPattern} lectures starting on {formData.date}
                </div>
              </div>
            )}
          </div>
        )}

        {formData.status && (
          <div className={`p-1.5 rounded-md text-xs ${
            formData.status === 'scheduled' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
            formData.status === 'ongoing' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
            'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
          }`}>
            Lecture status: <span className="font-medium capitalize">{formData.status}</span>
          </div>
        )}

        <div className="pt-2 flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                     rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-3 py-1.5 text-xs bg-blue-500 text-white rounded-md 
                     hover:bg-blue-600 transition-colors disabled:opacity-75"
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              lectureToEdit ? 'Update' : 'Schedule'
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmedSubmit}
        title={lectureToEdit ? "Confirm Lecture Update" : "Confirm Lecture Schedule"}
        message={
          formData.isRecurring && !lectureToEdit
            ? `This will create ${formData.recurringCount} ${formData.recurringPattern} lectures starting on ${formData.date}. Are you sure you want to proceed?`
            : `Are you sure you want to ${lectureToEdit ? 'update' : 'schedule'} this lecture?`
        }
        confirmText={lectureToEdit ? "Update" : "Schedule"}
        type="info"
      />
    </div>
  );
};

export default ScheduleLectureForm; 