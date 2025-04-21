import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import organizationService from '../services/organizationService';
import Swal from 'sweetalert2';

const ManageOrganizations = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Only fetch organizations if user is authenticated and is an admin
    if (isAuthenticated && user?.role === 'admin') {
      fetchOrganizations();
    }
    
    // Set authChecked to true once we've checked authentication
    if (isAuthenticated !== null) {
      setAuthChecked(true);
    }
  }, [isAuthenticated, user, statusFilter]);

  const fetchOrganizations = async () => {
    try {
      const response = await organizationService.getAllOrganizations(statusFilter);
      setOrganizations(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (organizationId, newStatus) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to ${newStatus} this organization?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, ${newStatus} it!`
      });

      if (result.isConfirmed) {
        await organizationService.updateOrganizationStatus(organizationId, newStatus);
        await fetchOrganizations();
        Swal.fire(
          'Success!',
          `Organization has been ${newStatus}.`,
          'success'
        );
      }
    } catch (err) {
      Swal.fire(
        'Error!',
        err.message || 'Failed to update organization status',
        'error'
      );
    }
  };

  const handleDelete = async (organizationId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'This will permanently delete the organization and all associated data. This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await organizationService.deleteOrganization(organizationId);
        await fetchOrganizations();
        Swal.fire(
          'Deleted!',
          'Organization has been deleted.',
          'success'
        );
      }
    } catch (err) {
      Swal.fire(
        'Error!',
        err.message || 'Failed to delete organization',
        'error'
      );
    }
  };

  const getStatusActions = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return [
          { label: 'Approve', status: 'approved', buttonClass: 'text-green-600 hover:text-green-900' },
          { label: 'Reject', status: 'rejected', buttonClass: 'text-red-600 hover:text-red-900' }
        ];
      case 'approved':
        return [
          { label: 'Move to Pending', status: 'pending', buttonClass: 'text-yellow-600 hover:text-yellow-900' },
          { label: 'Reject', status: 'rejected', buttonClass: 'text-red-600 hover:text-red-900' }
        ];
      case 'rejected':
        return [
          { label: 'Move to Pending', status: 'pending', buttonClass: 'text-yellow-600 hover:text-yellow-900' },
          { label: 'Approve', status: 'approved', buttonClass: 'text-green-600 hover:text-green-900' }
        ];
      default:
        return [];
    }
  };

  const handleRowClick = (organizationId) => {
    navigate(`/organizations/${organizationId}`);
  };

  // Show loading indicator while checking authentication
  if (!authChecked || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  if (loading && authChecked) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Loading organizations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="flex justify-between items-center">
                <h1 className="text-lg font-medium text-gray-900">Manage Organizations</h1>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700">
                {error}
              </div>
            )}

            {/* No Records Message */}
            {!loading && organizations.length === 0 && (
              <div className="py-6 px-4 text-center">
                <div className="flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No {statusFilter} organizations</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {statusFilter === 'pending' && "There are no pending organizations waiting for review."}
                    {statusFilter === 'approved' && "There are no approved organizations in the system."}
                    {statusFilter === 'rejected' && "There are no rejected organizations in the system."}
                  </p>
                </div>
              </div>
            )}

            {/* Mobile View - Card Layout */}
            {!loading && organizations.length > 0 && (
              <div className="block md:hidden">
                <div className="divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <div 
                      key={org.id} 
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(org.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{org.institution_name}</h3>
                          <p className="text-sm text-gray-500">{org.email}</p>
                          <p className="text-sm text-gray-500">{org.province}, {org.district}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            org.status === 'approved' ? 'bg-green-100 text-green-800' :
                            org.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {org.status}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(org.id);
                            }} 
                            className="mt-2 text-red-600 hover:text-red-900"
                            title="Delete organization"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-4">
                        {getStatusActions(org.status).map((action) => (
                          <button
                            key={action.status}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(org.id, action.status);
                            }}
                            className={action.buttonClass}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desktop View - Table Layout */}
            {!loading && organizations.length > 0 && (
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {organizations.map((org) => (
                        <tr 
                          key={org.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleRowClick(org.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{org.institution_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{org.email}</div>
                            <div className="text-sm text-gray-500">{org.contact_number}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{org.province}, {org.district}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              org.status === 'approved' ? 'bg-green-100 text-green-800' :
                              org.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {org.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2" onClick={(e) => e.stopPropagation()}>
                            {getStatusActions(org.status).map((action) => (
                              <button
                                key={action.status}
                                onClick={() => handleStatusUpdate(org.id, action.status)}
                                className={action.buttonClass}
                              >
                                {action.label}
                              </button>
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleDelete(org.id)} 
                              className="text-red-600 hover:text-red-900"
                              title="Delete organization"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageOrganizations;