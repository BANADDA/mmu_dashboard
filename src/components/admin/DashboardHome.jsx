import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import {
  BookOpen,
  Building2,
  Calendar,
  Clock,
  Loader2,
  UserCheck,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';

const DashboardHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    departments: 0,
    courses: 0,
    lectures: 0,
    users: 0,
    recentLectures: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get department count - don't filter by active field
      const departmentsCount = await getCountFromServer(
        collection(db, 'departments')
      );
      
      // Get courses count - don't filter by active field
      const coursesCount = await getCountFromServer(
        collection(db, 'courses')
      );
      
      // Get lectures count
      const lecturesCount = await getCountFromServer(collection(db, 'lectures'));
      
      // Get users count
      const usersCount = await getCountFromServer(collection(db, 'users'));
      
      // Log the counts for debugging
      console.log('Dashboard Stats:', {
        departments: departmentsCount.data().count,
        courses: coursesCount.data().count,
        lectures: lecturesCount.data().count,
        users: usersCount.data().count
      });
      
      // Get recent lectures
      const recentLecturesQuery = query(
        collection(db, 'lectures'),
        orderBy('date', 'desc'),
        limit(5)
      );
      
      const recentLectures = [];
      try {
        const recentLecturesSnapshot = await getDocs(recentLecturesQuery);
        console.log(`Retrieved ${recentLecturesSnapshot.docs.length} recent lectures`);
        
        for (const lectureDoc of recentLecturesSnapshot.docs) {
          try {
            const lectureData = {
              id: lectureDoc.id,
              ...lectureDoc.data()
            };
            
            // Get course details
            if (lectureData.courseId) {
              try {
                const courseSnapshot = await getDocs(
                  query(collection(db, 'courses'), where('__name__', '==', lectureData.courseId))
                );
                
                if (!courseSnapshot.empty) {
                  lectureData.course = {
                    id: courseSnapshot.docs[0].id,
                    ...courseSnapshot.docs[0].data()
                  };
                }
              } catch (courseError) {
                console.error(`Error fetching course for lecture ${lectureData.id}:`, courseError);
              }
            }
            
            // Get lecturer details
            if (lectureData.lecturerId) {
              try {
                const lecturerSnapshot = await getDocs(
                  query(collection(db, 'users'), where('__name__', '==', lectureData.lecturerId))
                );
                
                if (!lecturerSnapshot.empty) {
                  lectureData.lecturer = {
                    id: lecturerSnapshot.docs[0].id,
                    ...lecturerSnapshot.docs[0].data()
                  };
                }
              } catch (lecturerError) {
                console.error(`Error fetching lecturer for lecture ${lectureData.id}:`, lecturerError);
              }
            }
            
            recentLectures.push(lectureData);
          } catch (lectureError) {
            console.error(`Error processing lecture document:`, lectureError);
          }
        }
      } catch (lecturesError) {
        console.error('Error fetching recent lectures:', lecturesError);
      }
      
      setStats({
        departments: departmentsCount.data().count,
        courses: coursesCount.data().count,
        lectures: lecturesCount.data().count,
        users: usersCount.data().count,
        recentLectures
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <div className="h-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Overview</h1>
      
          
          {/* Welcome Message */}
          <div className="mt-8 mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow p-6 text-white">
            <h2 className="text-xl font-bold mb-2">Welcome, {user?.displayName || 'Administrator'}!</h2>
            <p className="opacity-80">
              You have access to manage departments, courses, lectures, and users. 
              Use the dashboard to monitor system activity and make administrative changes.
            </p>
          </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Departments</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.departments}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Courses</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.courses}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lectures</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.lectures}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Lectures */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Lectures</h2>
            </div>
            
            <div className="overflow-x-auto">
              {stats.recentLectures.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date/Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lecture</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lecturer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.recentLectures.map(lecture => (
                      <tr key={lecture.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">{formatDate(lecture.date)}</div>
                          <div className="text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {lecture.startTime} - {lecture.endTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {lecture.title || 'Untitled Lecture'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {lecture.course ? (
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2 text-green-500" />
                              <span>{lecture.course.name}</span>
                            </div>
                          ) : (
                            <span className="italic">Unknown course</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {lecture.lecturer ? (
                            <div className="flex items-center">
                              <UserCheck className="h-4 w-4 mr-2 text-blue-500" />
                              <span>{lecture.lecturer.displayName || lecture.lecturer.email}</span>
                            </div>
                          ) : (
                            <span className="italic">Not assigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No lectures found. Schedule some lectures to see them here.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome; 