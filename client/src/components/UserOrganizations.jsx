import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import organizationService from '../services/organizationService';
import Swal from 'sweetalert2';

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
      // Only fetch regular organizations
      const orgResponse = await organizationService.getUserOrganizations();
      
      setOrganizations(orgResponse.data || []);
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

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'This will permanently delete this organization. This action cannot be undone!',
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
          'Your organization registration has been deleted.',
          'success'
        );
        
        // Refresh the list after deletion
        fetchUserOrganizations();
      }
    } catch (err) {
      console.error('Error deleting organization:', err);
      Swal.fire(
        'Error!',
        'Failed to delete organization. Please try again.',
        'error'
      );
    }
  };

  const handleSubmitToOrganization = async (orgId) => {
    try {
      await Swal.fire({
        title: 'Submit Organization?',
        text: 'This will submit your organization for review. Are you sure you want to proceed?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, submit it!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          // Get the organization details
          const orgResponse = await organizationService.getOrganizationById(orgId);
          const org = orgResponse.data;
          
          // Format the data for the organizations table
          const organizationData = {
            province: org.province,
            district: org.district,
            institutionName: org.institution_name,
            websiteUrl: org.website_url,
            personalDetails: {
              name: org.name,
              designation: org.designation,
              email: org.email,
              contactNumber: org.contact_number
            },
            organizationLogoUrl: org.organization_logo,
            profileImageUrl: org.profile_image,
            services: org.services || []
          };
          
          // Update the organization status to 'pending'
          await organizationService.updateOrganization(orgId, {
            ...organizationData,
            status: 'pending'
          });
          
          Swal.fire(
            'Submitted!',
            'Your organization has been submitted for review.',
            'success'
          );
          
          // Refresh the list
          fetchUserOrganizations();
        }
      });
    } catch (err) {
      console.error('Error submitting organization:', err);
      Swal.fire(
        'Error!',
        'Failed to submit organization. Please try again.',
        'error'
      );
    }
  };

  const getStatusBadge = (status, issubmitted) => {
    // If not submitted, show as Draft regardless of status
    if (issubmitted === false) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Draft
        </span>
      );
    }
    
    // If submitted, show actual status
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
            {status || 'Unknown'}
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Organizations</h2>
        <button
          onClick={scrollToForm}
          className="bg-blue-500 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-600 transition transform hover:scale-105 shadow"
        >
          Register New
        </button>
      </div>

      <div className="space-y-6">
        {organizations.map((org) => (
          <div key={org.id} className="border rounded-md p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-medium">{org.institution_name}</h3>
              <div className="flex gap-2">
                {getStatusBadge(org.status, org.issubmitted)}
              </div>
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
                  to={org.issubmitted === false ? `/pending-organizations/${org.id}/details` : `/organizations/${org.id}/details`}
                  className="text-blue-600 hover:text-blue-800 mr-4"
                >
                  View Details
                </Link>
                {org.status === 'pending' && (
                  <>
                    <Link
                      to={`/organizations/${org.id}/edit`}
                      className="text-green-600 hover:text-green-800 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(org.id)}
                      className="text-red-600 hover:text-red-800 mr-4"
                    >
                      Delete
                    </button>
                  </>
                )}
                {!org.status && (
                  <button
                    onClick={() => handleSubmitToOrganization(org.id)}
                    className="bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-600"
                  >
                    Submit Organization
                  </button>
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