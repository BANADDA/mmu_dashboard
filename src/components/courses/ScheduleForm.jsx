import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { AlertTriangle, Calendar, Clock, Loader2, MapPin, Save, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';

const ScheduleForm = ({ course, onClose, onScheduleAdded }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: course?.location || '',
    topics: [],
    notes: ''
  });
  const [newTopic, setNewTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle adding a topic
  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    
    if (formData.topics.includes(newTopic.trim())) {
      setError('This topic already exists');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setFormData({
      ...formData,
      topics: [...formData.topics, newTopic.trim()]
    });
    setNewTopic('');
  };

  // Handle removing a topic
  const handleRemoveTopic = (topicToRemove) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter(topic => topic !== topicToRemove)
    });
  };

  // Handle topic input key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };

  // Validate form before submission
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter a lecture title');
      return false;
    }
    
    if (!formData.date) {
      setError('Please select a date');
      return false;
    }
    
    if (!formData.startTime) {
      setError('Please select a start time');
      return false;
    }
    
    if (!formData.endTime) {
      setError('Please select an end time');
      return false;
    }
    
    // Check if end time is after start time
    if (formData.startTime >= formData.endTime) {
      setError('End time must be after start time');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!course?.id) {
      setError('Course information is missing');
      return;
    }
    
    if (!user?.uid) {
      setError('User authentication issue. Please sign in again.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create new lecture document
      const lectureData = {
        title: formData.title.trim(),
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location.trim(),
        topics: formData.topics,
        notes: formData.notes.trim(),
        courseId: course.id,
        lecturerId: user.uid, // Automatically assign to current lecturer
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const lectureRef = await addDoc(collection(db, 'lectures'), lectureData);
      console.log('Created new lecture:', lectureRef.id);
      
      // Add ID to the lecture data
      const newLecture = {
        id: lectureRef.id,
        ...lectureData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setSuccessMessage('Lecture scheduled successfully');
      
      // Notify parent component
      if (onScheduleAdded) {
        onScheduleAdded(newLecture);
      }
      
      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error scheduling lecture:', error);
      setError('Failed to schedule lecture. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Schedule New Lecture
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {/* Error and success messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-300">
              {successMessage}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Course Details */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                Scheduling for:
              </div>
              <div className="text-gray-800 dark:text-gray-200 font-semibold">
                {course.name} ({course.code})
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Department: {course.departmentName}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Assigned to: {user?.displayName || user?.email || 'You (current lecturer)'}
              </div>
            </div>
            
            {/* Lecture Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lecture Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter a descriptive title for the lecture"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
              </div>
              
              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time Range *
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                      required
                    />
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder={course.location ? `Default: ${course.location}` : 'Specify a location'}
                />
              </div>
              {course.location && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to use the course's default location.
                </div>
              )}
            </div>
            
            {/* Topics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lecture Topics
              </label>
              
              <div className="flex items-center mb-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Add a topic..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="ml-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Add
                </button>
              </div>
              
              {formData.topics.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.topics.map((topic) => (
                    <div 
                      key={topic}
                      className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded dark:bg-blue-900 dark:text-blue-300"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(topic)}
                        className="ml-1.5 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No topics added yet. Topics help students understand what will be covered.
                </p>
              )}
            </div>
            
            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Any additional notes or information about this lecture"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 border border-transparent rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Schedule Lecture
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleForm; 