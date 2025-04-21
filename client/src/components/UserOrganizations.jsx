import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import organizationService from '../services/organizationService';

const UserOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserOrganizations();
  }, []);

  const fetchUserOrganizations = async () => {
    try {
      setLoading(true);
      const response = await organizationService.getUserOrganizations();
      setOrganizations(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch your organizations. Please try again later.');
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to scroll to the organization form
  const scrollToForm = () => {
    const formElement = document.getElementById("organization-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={fetchUserOrganizations} 
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-gray-600 text-center mb-4">You haven't submitted any organization yet.</p>
        <div className="flex justify-center">
          <button
            onClick={scrollToForm}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition transform hover:scale-105 shadow"
          >
            Register an Organization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Organizations</h2>
        <button
          onClick={scrollToForm}
          className="bg-blue-500 text-white px-3 py-1 text-sm rounded-md hover:bg-blue-600 transition transform hover:scale-105 shadow"
        >
          Register New
        </button>
      </div>

      <div className="space-y-6">
        {organizations.map((org) => (
          <div key={org.id} className="border rounded-md p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-medium">{org.institution_name}</h3>
              {getStatusBadge(org.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-sm text-gray-500">Location: {org.province}, {org.district}</p>
                {org.website_url && (
                  <p className="text-sm text-gray-500">
                    Website: <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{org.website_url}</a>
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact: {org.name}</p>
                <p className="text-sm text-gray-500">Email: {org.email}</p>
              </div>
            </div>

            <div className="border-t pt-3 mt-3 flex justify-between">
              <div>
                <Link
                  to={`/organizations/${org.id}/details`}
                  className="text-blue-600 hover:text-blue-800 mr-4"
                >
                  View Details
                </Link>
                {org.status === 'pending' && (
                  <Link
                    to={`/organizations/${org.id}/edit`}
                    className="text-green-600 hover:text-green-800"
                  >
                    Edit
                  </Link>
                )}
              </div>
              <div>
                <span className="text-xs text-gray-500">
                  Submitted on {new Date(org.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserOrganizations;