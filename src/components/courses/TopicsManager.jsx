import { doc, updateDoc } from 'firebase/firestore';
import { AlertTriangle, Loader2, Save, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';

const TopicsManager = ({ lecture, onClose, onTopicsUpdated }) => {
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize topics from the lecture
  useEffect(() => {
    if (lecture && lecture.topics) {
      setTopics(lecture.topics);
    } else {
      setTopics([]);
    }
  }, [lecture]);

  // Handle adding a new topic
  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    
    // Check for duplicates
    if (topics.includes(newTopic.trim())) {
      setError('This topic already exists');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setTopics([...topics, newTopic.trim()]);
    setNewTopic('');
  };

  // Handle removing a topic
  const handleRemoveTopic = (topicToRemove) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!lecture || !lecture.id) {
      setError('No lecture selected');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const lectureRef = doc(db, 'lectures', lecture.id);
      await updateDoc(lectureRef, {
        topics: topics,
        updatedAt: new Date()
      });
      
      setSuccessMessage('Topics updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Notify parent component
      if (onTopicsUpdated) {
        onTopicsUpdated(topics);
      }
    } catch (error) {
      console.error('Error updating lecture topics:', error);
      setError('Failed to update topics. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle pressing Enter in the input field
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };
  
  // Format date for nice display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Manage Lecture Topics
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          {/* Lecture Details */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4">
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
              Lecture Details:
            </div>
            <div className="text-gray-800 dark:text-gray-200 font-semibold">
              {lecture?.title || 'Untitled Lecture'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Date: {formatDate(lecture?.date)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Time: {lecture?.startTime} - {lecture?.endTime}
            </div>
            {lecture?.location && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Location: {lecture.location}
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Error and Success Messages */}
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
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Add topics to help students understand what will be covered in this lecture.
              </p>
              
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
                    placeholder="Add a topic (e.g., 'Database Design')"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
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
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 min-h-[100px] bg-white dark:bg-gray-800">
                {topics.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No topics added yet. Topics help students understand what will be covered.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {topics.map(topic => (
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
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Topics
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TopicsManager; 