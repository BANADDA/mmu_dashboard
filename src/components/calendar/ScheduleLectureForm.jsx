import { X } from 'lucide-react';
import { useState } from 'react';

const ScheduleLectureForm = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    unit: 'Software Engineering',
    room: 'Block A - Room 101',
    date: '',
    startTime: '09:00',
    endTime: '11:00',
    classRep: '',
    notes: '',
    isRecurring: false,
    recurringPattern: 'weekly'
  });

  const units = [
    { id: 1, name: 'Software Engineering', color: 'bg-blue-500' },
    { id: 2, name: 'Database Systems', color: 'bg-green-500' },
    { id: 3, name: 'Web Development', color: 'bg-purple-500' },
    { id: 4, name: 'Computer Networks', color: 'bg-orange-500' },
    { id: 5, name: 'Operating Systems', color: 'bg-teal-500' },
    { id: 6, name: 'Algorithms and Data Structures', color: 'bg-pink-500' }
  ];

  const rooms = [
    { id: 1, name: 'Block A - Room 101' },
    { id: 2, name: 'Block A - Room 102' },
    { id: 3, name: 'Block B - Lab 201' },
    { id: 4, name: 'Block B - Lab 203' },
    { id: 5, name: 'Block C - Room 301' },
    { id: 6, name: 'Block C - Room 305' }
  ];

  const students = [
    { id: 1, name: 'John Doe', course: 'Software Engineering' },
    { id: 2, name: 'Jane Smith', course: 'Database Systems' },
    { id: 3, name: 'Mike Johnson', course: 'Web Development' },
    { id: 4, name: 'Sarah Williams', course: 'Operating Systems' },
    { id: 5, name: 'Alex Johnson', course: 'Computer Networks' },
    { id: 6, name: 'Robert Chen', course: 'Mobile Development' },
    { id: 7, name: 'Emily Parker', course: 'Algorithms and Data Structures' }
  ];

  const lectureTypes = [
    { id: 1, name: 'Lecture' },
    { id: 2, name: 'Lab' },
    { id: 3, name: 'Tutorial' },
    { id: 4, name: 'Workshop' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedUnit = units.find(u => u.name === formData.unit);
    onSubmit({
      ...formData,
      color: selectedUnit.color,
      id: Date.now()
    });
    onClose();
  };

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
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                     text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                     focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Introduction to Data Structures"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">
              Teaching Unit
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                       text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                       focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {units.map(unit => (
                <option key={unit.id} value={unit.name}>
                  {unit.name}
                </option>
              ))}
            </select>
          </div>
          <div>
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
                <option key={type.id} value={type.name.toLowerCase()}>
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
            Class Representative
          </label>
          <select
            name="classRep"
            value={formData.classRep}
            onChange={handleChange}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md 
                     text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800
                     focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a Class Representative</option>
            {students.map(student => (
              <option key={student.id} value={student.name}>
                {student.name} - {student.course}
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
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        )}

        <div className="pt-2 flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                     rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-3 py-1.5 text-xs bg-blue-500 text-white rounded-md 
                     hover:bg-blue-600 transition-colors"
          >
            Schedule
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleLectureForm; 