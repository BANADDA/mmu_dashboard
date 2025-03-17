import { doc, updateDoc } from 'firebase/firestore';
import { AlertCircle, Building, Check, Loader2, MapPin, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';

const LocationManager = ({ course, onClose, onLocationUpdated }) => {
  const [location, setLocation] = useState(course?.location || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Common campus locations - to be customized for the university
  const commonLocations = [
    'Main Campus - Room 101',
    'Main Campus - Room 102',
    'Main Campus - Lecture Hall A',
    'Main Campus - Lecture Hall B',
    'Science Building - Lab 1',
    'Science Building - Lab 2',
    'Engineering Building - Room 201',
    'Library - Study Room 3',
    'Online - Virtual Classroom'
  ];

  useEffect(() => {
    // Update location when course changes
    if (course?.location) {
      setLocation(course.location);
    } else {
      setLocation('');
    }
  }, [course]);

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
  };

  const handleSelectCommonLocation = (commonLocation) => {
    setLocation(commonLocation);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!course?.id) {
      setError('Cannot update location - course information is missing');
      return;
    }
    
    if (!location.trim()) {
      setError('Please specify a location');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Update course document in Firestore
      const courseRef = doc(db, 'courses', course.id);
      await updateDoc(courseRef, {
        location: location.trim(),
        updatedAt: new Date()
      });
      
      console.log('Course location updated successfully');
      setSuccess('Location updated successfully');
      
      // Notify parent component
      if (onLocationUpdated) {
        onLocationUpdated(location.trim());
      }
      
      // Close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating course location:', error);
      setError('Failed to update location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Set Default Course Location
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          {error && (
            <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 flex items-start">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm text-blue-800 dark:text-blue-300 mb-4">
            Setting default location for: <span className="font-medium">{course?.name} ({course?.code})</span>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Location Input */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Course Location
                </label>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={location}
                    onChange={handleLocationChange}
                    placeholder="Enter the regular location for this course"
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This will be the default location used when scheduling lectures for this course.
                </p>
              </div>
              
              {/* Common Locations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Common Locations
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {commonLocations.map((commonLocation) => (
                    <button
                      key={commonLocation}
                      type="button"
                      onClick={() => handleSelectCommonLocation(commonLocation)}
                      className="flex items-center text-left px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Building className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                      {commonLocation}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Info Section */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded p-3 text-xs text-gray-600 dark:text-gray-400">
                <p className="font-medium mb-1">Note:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>This sets the default location for this course</li>
                  <li>You can still specify different locations when scheduling individual lectures</li>
                  <li>Students will see this location in the course details</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Location
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

export default LocationManager; 