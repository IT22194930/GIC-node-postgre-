import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import organizationService from '../services/organizationService';
import Navbar from '../components/Navbar';

const OrganizationUserView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    fetchOrganizationDetails();
  }, [id]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

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
                onClick={() => navigate('/')}
                className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Back to Home
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
                onClick={() => navigate('/')}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">{organization.institution_name}</h1>
            </div>
            {organization.status === 'pending' && (
              <button
                onClick={() => navigate(`/organizations/${id}/edit`)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Edit
              </button>
            )}
          </div>

          <div className="p-6">
            {/* Image section with logo and profile photo */}
            <div className="mb-6 flex flex-col md:flex-row gap-6">
              {/* Organization Logo */}
              <div className="w-full md:w-1/2">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Organization Logo</h3>
                <div className="border rounded-md p-4 flex justify-center items-center bg-gray-50 h-64">
                  {organization.organization_logo ? (
                    <img 
                      src={organization.organization_logo} 
                      alt="Organization Logo" 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = '/gic-logo.png';
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="mt-2">No logo available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Person Profile Image */}
              <div className="w-full md:w-1/2">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Person</h3>
                <div className="border rounded-md p-4 flex flex-col items-center bg-gray-50 h-64">
                  {organization.profile_image ? (
                    <img 
                      src={organization.profile_image} 
                      alt="Contact Person" 
                      className="max-h-48 max-w-full object-contain mb-2"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                      }}
                    />
                  ) : (
                    <div className="h-48 w-48 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <p className="font-medium text-center">{organization.name}</p>
                  <p className="text-sm text-gray-500 text-center">{organization.designation}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Organization Details</h2>
                {getStatusBadge(organization.status)}
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

            {/* Status message based on status */}
            <div className="mb-6 p-4 rounded-md border">
              {organization.status === 'pending' && (
                <div className="text-yellow-600">
                  <h3 className="font-medium">Your organization registration is pending approval</h3>
                  <p className="mt-1 text-sm">Our admin team is reviewing your application. You can still edit your information while it's pending.</p>
                </div>
              )}
              {organization.status === 'approved' && (
                <div className="text-green-600">
                  <h3 className="font-medium">Your organization registration has been approved!</h3>
                  <p className="mt-1 text-sm">Your organization is now listed in our directory.</p>
                </div>
              )}
              {organization.status === 'rejected' && (
                <div className="text-red-600">
                  <h3 className="font-medium">Your organization registration was not approved</h3>
                  <p className="mt-1 text-sm">Please contact our support team for more information.</p>
                </div>
              )}
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

export default OrganizationUserView;