import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import organizationService from '../services/organizationService';
import Navbar from '../components/Navbar';
import Swal from 'sweetalert2';

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrganizationDetails();
  }, [id]);

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);
      const response = await organizationService.getOrganizationById(id);
      setOrganization(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
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
        await organizationService.updateOrganizationStatus(id, newStatus);
        await fetchOrganizationDetails();
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

  const handleDelete = async () => {
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
        await organizationService.deleteOrganization(id);
        Swal.fire(
          'Deleted!',
          'Organization has been deleted.',
          'success'
        );
        navigate('/organizations');
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
          { label: 'Approve', status: 'approved', buttonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500' },
          { label: 'Reject', status: 'rejected', buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500' }
        ];
      case 'approved':
        return [
          { label: 'Move to Pending', status: 'pending', buttonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' },
          { label: 'Reject', status: 'rejected', buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500' }
        ];
      case 'rejected':
        return [
          { label: 'Move to Pending', status: 'pending', buttonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' },
          { label: 'Approve', status: 'approved', buttonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500' }
        ];
      default:
        return [];
    }
  };

  // Check for authentication and admin role
  if (!user || user.role !== 'admin') {
    return navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="text-red-500">{error || 'Organization not found'}</div>
              <button 
                onClick={() => navigate('/organizations')}
                className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Back to Organizations
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/organizations')}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">{organization.institution_name}</h1>
            </div>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Organization Details</h2>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                  organization.status === 'approved' ? 'bg-green-100 text-green-800' :
                  organization.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {organization.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Institution Information</h3>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <div>
                      <span className="font-medium">Province:</span> {organization.province}
                    </div>
                    <div>
                      <span className="font-medium">District:</span> {organization.district}
                    </div>
                    {organization.website_url && (
                      <div>
                        <span className="font-medium">Website:</span>{' '}
                        <a href={organization.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {organization.website_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <div>
                      <span className="font-medium">Contact Person:</span> {organization.name}
                    </div>
                    <div>
                      <span className="font-medium">Designation:</span> {organization.designation}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {organization.email}
                    </div>
                    <div>
                      <span className="font-medium">Contact Number:</span> {organization.contact_number}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Status Actions</h3>
              <div className="flex space-x-4">
                {getStatusActions(organization.status).map((action) => (
                  <button
                    key={action.status}
                    onClick={() => handleStatusUpdate(action.status)}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${action.buttonClass}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Services</h3>
              {organization.services && organization.services.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirements</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {organization.services.map((service) => (
                        <tr key={service.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.serviceName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.category}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{service.description}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{service.requirements}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No services listed for this organization</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetail;