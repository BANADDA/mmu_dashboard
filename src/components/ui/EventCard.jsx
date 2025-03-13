import { format } from 'date-fns';
import { Clock, MapPin, User } from 'lucide-react';

const EventCard = ({ event }) => {
  const getEventTypeColor = (type) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'lab':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'meeting':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'workshop':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={`border rounded-md overflow-hidden shadow-sm mb-2 ${getEventTypeColor(event.type)}`}>
      <div className="p-3">
        <h3 className="font-medium">{event.title}</h3>
        <p className="text-sm mt-1">{event.description}</p>
        
        <div className="mt-3 space-y-1">
          <div className="flex items-center text-xs">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
            </span>
          </div>
          
          <div className="flex items-center text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{event.location}</span>
          </div>
          
          <div className="flex items-center text-xs">
            <User className="h-3 w-3 mr-1" />
            <span>{event.host}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard; 