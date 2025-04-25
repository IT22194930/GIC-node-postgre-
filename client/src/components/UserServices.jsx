import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import serviceService from '../services/serviceService';
import Swal from 'sweetalert2';

const UserServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserServices();
  }, []);

  const fetchUserServices = async () => {
    try {
      setLoading(true);
      // Using getUserSubmittedServices instead of getUserServices to get from services_for_review
      const response = await serviceService.getUserSubmittedServices();
      // Ensure we're getting an array, even if data is not present or not in expected format
      setServices(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch your service submissions. Please try again later.');
      console.error('Error fetching service submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to scroll to the service form
  const scrollToForm = () => {
    const formElement = document.getElementById("service-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDelete = async (serviceId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'This will permanently delete this service submission. This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        // Using deleteServiceSubmission instead of deleteService
        await serviceService.deleteServiceSubmission(serviceId);
        
        Swal.fire(
          'Deleted!',
          'Your service submission has been deleted.',
          'success'
        );
        
        // Refresh the list after deletion
        fetchUserServices();
      }
    } catch (err) {
      console.error('Error deleting service submission:', err);
      Swal.fire(
        'Error!',
        'Failed to delete service submission. Please try again.',
        'error'
      );
    }
  };

  const handleSubmitService = async (service) => {
    try {
      const result = await Swal.fire({
        title: 'Submit Service',
        text: 'Are you sure you want to submit this service for approval?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, submit it!'
      });

      if (result.isConfirmed) {
        // Call the API to submit the service
        await serviceService.submitServiceForApproval(service.id);
        
        Swal.fire(
          'Submitted!',
          'Your service has been submitted for approval.',
          'success'
        );
        
        // Refresh the list after submission
        fetchUserServices();
      }
    } catch (err) {
      console.error('Error submitting service:', err);
      Swal.fire(
        'Error!',
        'Failed to submit service. Please try again.',
        'error'
      );
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
          onClick={fetchUserServices} 
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (services.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <p className="text-gray-600 text-center mb-4">You haven't submitted any services yet.</p>
        <div className="flex justify-center">
          <button
            onClick={scrollToForm}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition transform hover:scale-105 shadow"
          >
            Create a Service
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Services</h2>
        <button
          onClick={scrollToForm}
          className="bg-blue-500 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-600 transition transform hover:scale-105 shadow"
        >
          Create New
        </button>
      </div>

      <div className="space-y-6">
        {services.map((service) => (
          <div key={service.id} className="border rounded-md p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-medium">{service.service_name}</h3>
              <div className="flex gap-2">
                {getStatusBadge(service.status)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-sm text-gray-500">Category: {service.category}</p>
                <p className="text-sm text-gray-500">Organization: {service.organization_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description: {service.description}</p>
                <p className="text-sm text-gray-500">Requirements: {service.requirements}</p>
              </div>
            </div>

            <div className="border-t pt-3 mt-3 flex justify-between">
              <div>
                <Link
                  to={`/organizations/${service.organization_id}/details`}
                  className="text-blue-600 hover:text-blue-800 mr-4"
                >
                  View Organization
                </Link>
                {service.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-800 mr-4"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleSubmitService(service)}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      Submit Service
                    </button>
                  </>
                )}
              </div>
              <div>
                <span className="text-xs text-gray-500">
                  Submitted on {new Date(service.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserServices;