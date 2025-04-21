import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { userService } from '../services/userService';
import organizationService from '../services/organizationService';

const AdminHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    recentActivity: 0
  });
  const [pendingOrgsCount, setPendingOrgsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchPendingOrganizations();

    // Listen for changes in pending organizations count
    window.addEventListener('pendingCountChange', fetchPendingOrganizations);
    
    return () => {
      window.removeEventListener('pendingCountChange', fetchPendingOrganizations);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const users = await userService.getAllUsers();
      const activeUsers = users.filter(user => user.lastLogin).length;
      const recentActivity = users.filter(user => {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        return new Date(user.updatedAt) > lastWeek;
      }).length;

      setStats({
        totalUsers: users.length,
        activeUsers,
        recentActivity
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrganizations = async () => {
    try {
      const response = await organizationService.getAllOrganizations("pending");
      setPendingOrgsCount(response.data.length);
    } catch (err) {
      console.error('Error fetching pending organizations:', err);
    }
  };

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                Admin Dashboard
              </h1>
              <p className="text-indigo-100 mb-4">
                Welcome back, {user?.name || "Admin"}! Here's an overview of your system.
              </p>
            </div>
            <div className="hidden md:block">
              <img 
                src="/gic-logo.png" 
                alt="GIC Logo" 
                className="h-20 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Total Users Card */}
          <div className="bg-white rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-105 duration-300">
            <div className="bg-blue-500 h-2"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Total Users</h2>
                <div className="bg-blue-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              {loading ? (
                <div className="animate-pulse h-12 w-20 bg-gray-200 rounded mb-2"></div>
              ) : (
                <div className="flex items-baseline">
                  <p className="text-4xl font-bold text-blue-600 mr-2">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-500">registered users</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Users Card */}
          <div className="bg-white rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-105 duration-300">
            <div className="bg-green-500 h-2"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Active Users</h2>
                <div className="bg-green-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {loading ? (
                <div className="animate-pulse h-12 w-20 bg-gray-200 rounded mb-2"></div>
              ) : (
                <div className="flex items-baseline">
                  <p className="text-4xl font-bold text-green-600 mr-2">{stats.activeUsers}</p>
                  <p className="text-sm text-gray-500">logged in users</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-xl overflow-hidden shadow-lg transform transition-transform hover:scale-105 duration-300">
            <div className="bg-purple-500 h-2"></div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
                <div className="bg-purple-100 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {loading ? (
                <div className="animate-pulse h-12 w-20 bg-gray-200 rounded mb-2"></div>
              ) : (
                <div>
                  <div className="flex items-baseline">
                    <p className="text-4xl font-bold text-purple-600 mr-2">{stats.recentActivity}</p>
                    <p className="text-sm text-gray-500">active users</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">in the last 7 days</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <div className="flex items-center mb-6">
            <div className="bg-indigo-600 w-1 h-8 mr-4 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/users"
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-b-4 border-blue-500 group"
            >
              <div className="flex items-start">
                <div className="mr-4 bg-blue-100 rounded-lg p-3 group-hover:bg-blue-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Users</h3>
                  <p className="text-gray-600 mb-4">View, edit and manage user accounts, permissions and roles</p>
                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-800">
                    <span>Go to Users</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link
              to="/organizations"
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-b-4 border-green-500 group relative"
            >
              {pendingOrgsCount > 0 && (
                <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                  {pendingOrgsCount}
                </span>
              )}
              <div className="flex items-start">
                <div className="mr-4 bg-green-100 rounded-lg p-3 group-hover:bg-green-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Organizations</h3>
                    {pendingOrgsCount > 0 && (
                      <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        {pendingOrgsCount} pending
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">
                    {pendingOrgsCount > 0 
                      ? `Review ${pendingOrgsCount} pending organization ${pendingOrgsCount === 1 ? 'request' : 'requests'}`
                      : 'Review, approve or reject organization registration requests'}
                  </p>
                  <div className="flex items-center text-green-600 font-medium group-hover:text-green-800">
                    <span>Go to Organizations</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div>
              <p className="text-gray-300 text-center">© {new Date().getFullYear()} GIC Admin Dashboard. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;