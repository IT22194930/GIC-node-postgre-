import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { userService } from '../services/userService';

const AdminHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
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

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-gray-200 rounded-lg p-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Admin Dashboard
            </h1>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Admin Statistics Cards */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Total Users</h2>
                  {loading ? (
                    <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
                  ) : null}
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? (
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                  ) : (
                    stats.totalUsers
                  )}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Active Users</h2>
                  {loading ? (
                    <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
                  ) : null}
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {loading ? (
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                  ) : (
                    stats.activeUsers
                  )}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
                  {loading ? (
                    <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
                  ) : null}
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {loading ? (
                    <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                  ) : (
                    stats.recentActivity
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-2">Users active in last 7 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome; 