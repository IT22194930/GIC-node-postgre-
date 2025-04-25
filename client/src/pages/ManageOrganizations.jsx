import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import organizationService from '../services/organizationService';
import serviceService from '../services/serviceService';
import Swal from 'sweetalert2';

// Create a custom event to notify the navbar about organization status changes
const notifyPendingCountChange = () => {
  const event = new CustomEvent('pendingCountChange');
  window.dispatchEvent(event);
};

const ManageOrganizations = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [serviceStatusFilter, setServiceStatusFilter] = useState('pending');
  const [activeTab, setActiveTab] = useState('organizations');
  const [authChecked, setAuthChecked] = useState(false);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingServices: 0,
    approvedServices: 0,
    rejectedServices: 0
  });

  useEffect(() => {
    // Only fetch organizations if user is authenticated and is an admin
    if (isAuthenticated && user?.role === 'admin') {
      fetchOrganizations();
      fetchOrganizationCounts();
      fetchServices();
      fetchServiceCounts();
    }
    
    // Set authChecked to true once we've checked authentication
    if (isAuthenticated !== null) {
      setAuthChecked(true);
    }
  }, [isAuthenticated, user, statusFilter, serviceStatusFilter]);

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

  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      const response = await serviceService.getAllServices(serviceStatusFilter);
      setServices(response.data);
    } catch (err) {
      console.error(`Error fetching ${serviceStatusFilter} services:`, err);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchServiceCounts = async () => {
    try {
      const pendingResponse = await serviceService.getAllServices("pending");
      const approvedResponse = await serviceService.getAllServices("approved");
      const rejectedResponse = await serviceService.getAllServices("rejected");
      
      setCounts(prevCounts => ({
        ...prevCounts,
        pendingServices: pendingResponse.data.length,
        approvedServices: approvedResponse.data.length,
        rejectedServices: rejectedResponse.data.length
      }));
    } catch (err) {
      console.error('Error fetching service counts:', err);
    }
  };

  const fetchOrganizationCounts = async () => {
    try {
      const pendingResponse = await organizationService.getAllOrganizations("pending");
      const approvedResponse = await organizationService.getAllOrganizations("approved");
      const rejectedResponse = await organizationService.getAllOrganizations("rejected");
      
      setCounts(prevCounts => ({
        ...prevCounts,
        pending: pendingResponse.data.length,
        approved: approvedResponse.data.length,
        rejected: rejectedResponse.data.length
      }));
    } catch (err) {
      console.error('Error fetching organization counts:', err);
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
        await fetchOrganizationCounts(); // Refresh counts
        // Notify that pending count might have changed
        notifyPendingCountChange();
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

  const handleServiceStatusUpdate = async (serviceId, newStatus) => {
    try {
      const actionText = newStatus === 'approved' ? 'approve' : 'reject';
      
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to ${actionText} this service?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, ${actionText} it!`
      });

      if (result.isConfirmed) {
        await serviceService.updateServiceStatus(serviceId, newStatus);
        await fetchServices();
        await fetchServiceCounts();
        Swal.fire(
          'Success!',
          `Service has been ${actionText}d.`,
          'success'
        );
      }
    } catch (err) {
      Swal.fire(
        'Error!',
        err.message || 'Failed to update service status',
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
        await fetchOrganizationCounts(); // Refresh counts
        // Notify that pending count might have changed
        notifyPendingCountChange();
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

  const handleServiceDelete = async (serviceId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'This will permanently delete the service. This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await serviceService.deleteServiceDirect(serviceId);
        await fetchServices();
        await fetchServiceCounts(); // Refresh counts
        Swal.fire(
          'Deleted!',
          'Service has been deleted.',
          'success'
        );
      }
    } catch (err) {
      Swal.fire(
        'Error!',
        err.message || 'Failed to delete service',
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

  if (loading && authChecked && activeTab === 'organizations') {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Loading organizations...</div>
        </div>
      </div>
    );
  }

  if (servicesLoading && authChecked && activeTab === 'services') {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Loading services...</div>
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
              <div className="flex flex-col">
                <h1 className="text-lg font-medium text-gray-900 mb-4">Admin Dashboard</h1>
                
                {/* Main Tabs */}
                <div className="flex flex-wrap border-b mb-4">
                  <button
                    onClick={() => setActiveTab('organizations')}
                    className={`py-2 px-4 flex items-center ${
                      activeTab === 'organizations'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Organizations
                  </button>
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`py-2 px-4 flex items-center ${
                      activeTab === 'services'
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Services
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      {counts.pendingServices}
                    </span>
                  </button>
                </div>
                
                {/* Organization Status Tabs - Only show if organizations tab is active */}
                {activeTab === 'organizations' && (
                  <div className="flex flex-wrap border-b">
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`py-1 sm:py-2 px-2 sm:px-4 flex items-center text-sm sm:text-base ${
                        statusFilter === 'pending'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Pending
                      <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                        statusFilter === 'pending'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {counts.pending}
                      </span>
                    </button>
                    <button
                      onClick={() => setStatusFilter('approved')}
                      className={`py-1 sm:py-2 px-2 sm:px-4 flex items-center text-sm sm:text-base ${
                        statusFilter === 'approved'
                          ? 'border-b-2 border-green-500 text-green-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Approved
                      <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                        statusFilter === 'approved'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {counts.approved}
                      </span>
                    </button>
                    <button
                      onClick={() => setStatusFilter('rejected')}
                      className={`py-1 sm:py-2 px-2 sm:px-4 flex items-center text-sm sm:text-base ${
                        statusFilter === 'rejected'
                          ? 'border-b-2 border-red-500 text-red-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Rejected
                      <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                        statusFilter === 'rejected'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {counts.rejected}
                      </span>
                    </button>
                  </div>
                )}
                
                {/* Service Status Tabs - Only show if services tab is active */}
                {activeTab === 'services' && (
                  <div className="flex flex-wrap border-b">
                    <button
                      onClick={() => setServiceStatusFilter('pending')}
                      className={`py-1 sm:py-2 px-2 sm:px-4 flex items-center text-sm sm:text-base ${
                        serviceStatusFilter === 'pending'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Pending
                      <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                        serviceStatusFilter === 'pending'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {counts.pendingServices}
                      </span>
                    </button>
                    <button
                      onClick={() => setServiceStatusFilter('approved')}
                      className={`py-1 sm:py-2 px-2 sm:px-4 flex items-center text-sm sm:text-base ${
                        serviceStatusFilter === 'approved'
                          ? 'border-b-2 border-green-500 text-green-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Approved
                      <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                        serviceStatusFilter === 'approved'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {counts.approvedServices}
                      </span>
                    </button>
                    <button
                      onClick={() => setServiceStatusFilter('rejected')}
                      className={`py-1 sm:py-2 px-2 sm:px-4 flex items-center text-sm sm:text-base ${
                        serviceStatusFilter === 'rejected'
                          ? 'border-b-2 border-red-500 text-red-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Rejected
                      <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full ${
                        serviceStatusFilter === 'rejected'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {counts.rejectedServices}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700">
                {error}
              </div>
            )}

            {/* ORGANIZATIONS TAB CONTENT */}
            {activeTab === 'organizations' && (
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Organizations
                </h2>
                {organizations.length === 0 ? (
                  <div className="text-center text-gray-500">No {statusFilter} organizations found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Address
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {organizations.map((org) => (
                          <tr 
                            key={org.id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleRowClick(org.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{org.institution_name}</div>
                              <div className="text-sm text-gray-500">{org.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{org.physical_address}</div>
                              <div className="text-sm text-gray-500">{org.district}, {org.province}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {org.phone_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                              {getStatusActions(statusFilter).map((action, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleStatusUpdate(org.id, action.status)}
                                  className={`${action.buttonClass} mr-4`}
                                >
                                  {action.label}
                                </button>
                              ))}
                              <button
                                onClick={() => handleDelete(org.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SERVICES TAB CONTENT */}
            {activeTab === 'services' && (
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {serviceStatusFilter.charAt(0).toUpperCase() + serviceStatusFilter.slice(1)} Services
                </h2>
                {services.length === 0 ? (
                  <div className="text-center text-gray-500">No {serviceStatusFilter} services found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service Name
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Organization
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {services.map((service) => (
                          <tr key={service.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {service.service_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {service.organization_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {service.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {getStatusActions(serviceStatusFilter).map((action, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleServiceStatusUpdate(service.id, action.status)}
                                  className={`${action.buttonClass} mr-4`}
                                >
                                  {action.label}
                                </button>
                              ))}
                              <button
                                onClick={() => handleServiceDelete(service.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageOrganizations;