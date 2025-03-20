import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import {
    Building2,
    GraduationCap,
    Loader2,
    UserCheck,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../firebase/auth';
import { db } from '../../firebase/config';

const DashboardHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    departments: 0,
    hodUsers: 0,
    lecturerUsers: 0,
    totalUsers: 0,
    students: 0,
    recentHODs: []
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get department count
      const departmentsCount = await getCountFromServer(
        collection(db, 'departments')
      );
      
      // Get HOD users count
      const hodUsersCount = await getCountFromServer(
        query(collection(db, 'users'), where('role', '==', USER_ROLES.HOD))
      );
      
      // Get lecturer users count
      const lecturerUsersCount = await getCountFromServer(
        query(collection(db, 'users'), where('role', '==', USER_ROLES.LECTURER))
      );
      
      // Get total users count
      const totalUsersCount = await getCountFromServer(collection(db, 'users'));
      
      // Get student count
      const studentsCount = await getCountFromServer(collection(db, 'students'));
      
      // Log the counts for debugging
      console.log('Dashboard Stats:', {
        departments: departmentsCount.data().count,
        hodUsers: hodUsersCount.data().count,
        lecturerUsers: lecturerUsersCount.data().count,
        totalUsers: totalUsersCount.data().count,
        students: studentsCount.data().count
      });
      
      // Get recent HODs
      const recentHODsQuery = query(
        collection(db, 'users'),
        where('role', '==', USER_ROLES.HOD),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const recentHODsSnapshot = await getDocs(recentHODsQuery);
      const recentHODs = recentHODsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStats({
        departments: departmentsCount.data().count,
        hodUsers: hodUsersCount.data().count,
        lecturerUsers: lecturerUsersCount.data().count,
        totalUsers: totalUsersCount.data().count,
        students: studentsCount.data().count,
        recentHODs
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>
      
      {/* Welcome Message */}
      <div className="mt-2 mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Welcome, {user?.displayName || 'Administrator'}!</h2>
        <p className="opacity-80">
          You have access to manage departments, HODs, and students. Use the dashboard to monitor system activity and make administrative changes according to the MMU Timetabling System requirements.
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">HOD Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.hodUsers}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <UserCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lecturer Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.lecturerUsers}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Students</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.students}</p>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <GraduationCap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Recently Added HODs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recently Added Heads of Departments</h2>
            </div>
            
            <div className="overflow-x-auto">
              {stats.recentHODs.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Added</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {stats.recentHODs.map(hod => (
                      <tr key={hod.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{hod.displayName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{hod.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {hod.createdAt ? new Date(hod.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-8 text-center">
                  <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No HODs Added Yet</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Head to the User Management section to add department heads.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* System Workflow Guide */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Admin Responsibilities</h2>
            </div>
            
            <div className="p-6">
              <ol className="space-y-4">
                <li className="flex">
                  <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-bold">1</div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Register Departments</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Create departments with unique MOU- codes that will be used in the system.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-bold">2</div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Register Heads of Departments</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Add HOD accounts who will manage programs and lecturers for their departments.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-bold">3</div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Register Programs</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Create academic programs under departments (e.g., BSc. Computer Science, BIT) with program code and duration.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-bold">4</div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Register Course Units</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Create course units under programs with names, codes, credit units, and year/semester of instruction. Note that a course unit can appear in multiple programs.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-bold">5</div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Register Students</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enter student numbers and details into the system. Students will receive email validation to create their accounts.</p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-sm font-bold">6</div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Oversight of System</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monitor HOD activities as they register additional programs and course units under their departments.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
          
          {/* Student Access Info */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Student Account Access</h2>
            </div>
            
            <div className="p-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <GraduationCap className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700 dark:text-amber-200">
                      <span className="font-medium">Student Registration Process:</span>
                    </p>
                    <ol className="mt-2 text-sm text-amber-700 dark:text-amber-200 list-decimal pl-5 space-y-1">
                      <li>Admin registers student details in the system</li>
                      <li>Student clicks on search and enters their student number</li>
                      <li>System validates the student through email</li>
                      <li>Student creates a password through the validation link</li>
                      <li>Student can now log in with their student number and password</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome; 