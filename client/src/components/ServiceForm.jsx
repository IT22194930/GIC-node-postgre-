import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import organizationService from '../services/organizationService';
import serviceService from '../services/serviceService';

const ServiceForm = () => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  
  const [services, setServices] = useState([{
    serviceName: '',
    category: '',
    description: '',
    requirements: ''
  }]);

  // Fetch organizations when component mounts
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Filter organizations based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      
      // Filter organizations
      const filtered = organizations.filter(org => 
        org.institution_name?.toLowerCase().includes(term) || 
        org.province?.toLowerCase().includes(term) || 
        org.district?.toLowerCase().includes(term)
      );
      
      setFilteredOrganizations(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredOrganizations([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, organizations]);

  // Handle clicks outside of search container
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  // Fetch approved organizations only
  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      
      // Fetch only approved organizations
      const response = await organizationService.getAllOrganizations('approved');
      setOrganizations(response.data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle organization selection from dropdown
  const handleOrganizationSelect = (org) => {
    setSelectedOrganization(org);
    setSearchTerm(`${org.institution_name} - ${org.province}, ${org.district}`);
    setShowSuggestions(false);
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = services.map((service, i) => {
      if (i === index) {
        return { ...service, [field]: value };
      }
      return service;
    });
    setServices(updatedServices);
  };

  const addService = () => {
    setServices(prev => [...prev, {
      serviceName: '',
      category: '',
      description: '',
      requirements: ''
    }]);
  };

  const removeService = (index) => {
    if (services.length <= 1) return; // Don't allow removing the last service
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOrganization) {
      toast.error('Please select an organization first');
      return;
    }
    
    if (!services[0].serviceName || !services[0].category || 
        !services[0].description || !services[0].requirements) {
      toast.error('Please fill in at least one service details');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Submit services one by one using the service API
      const submissionPromises = services.map(service => 
        serviceService.createService(
          selectedOrganization.id,
          {
            serviceName: service.serviceName,
            category: service.category,
            description: service.description,
            requirements: service.requirements
          }
        )
      );
      
      await Promise.all(submissionPromises);
      
      // Reset form after successful submission
      setServices([{
        serviceName: '',
        category: '',
        description: '',
        requirements: ''
      }]);
      setSelectedOrganization(null);
      setSearchTerm('');
      
      // Show success message with pending approval info
      Swal.fire({
        title: 'Services submitted successfully!',
        text: 'Your services have been submitted for admin approval. You will be notified once they are approved.',
        icon: 'success',
        confirmButtonText: 'Got it!'
      });
    } catch (error) {
      console.error('Service submission error:', error);
      toast.error(error.message || 'Error submitting service details');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const hasOrganizations = organizations.length > 0;

  return (
    <div>
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-t-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-white">Add Services</h1>
        <p className="text-purple-100 mt-2">
          Select an approved organization first, then add services to it
        </p>
      </div>

      <div className="bg-white rounded-b-lg shadow-lg p-8 space-y-8">
        {!hasOrganizations ? (
          <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Approved Organizations Available</h3>
            <p className="text-gray-600">
              There are no approved organizations in the system yet.
              <br />
              Please register an organization and wait for approval.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Organization Selection Section */}
            <div className="relative border-b pb-8 pt-6">
              <div className="absolute -top-4 -left-2 bg-purple-500 text-white px-4 py-1 rounded-full shadow-md">
                <span className="text-lg font-medium">Step 1: Select Organization</span>
              </div>
              
              <div className="mt-4">
                <label htmlFor="organizationSearch" className="block text-gray-700 font-medium mb-2">
                  Search for an approved organization:
                </label>
                <div ref={searchContainerRef} className="relative">
                  <div className="flex items-center border border-gray-300 rounded-md bg-white overflow-hidden">
                    <input
                      id="organizationSearch"
                      type="text"
                      className="w-full p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Type to search for organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={() => setShowSuggestions(true)}
                      autoComplete="off"
                    />
                    {searchTerm && (
                      <button 
                        type="button" 
                        className="px-3 py-1 text-gray-500 hover:text-gray-700"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedOrganization(null);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {showSuggestions && filteredOrganizations.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredOrganizations.map((org) => (
                        <div 
                          key={org.id}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 flex justify-between items-center"
                          onClick={() => handleOrganizationSelect(org)}
                        >
                          <div>
                            <div className="font-medium">{org.institution_name}</div>
                            <div className="text-sm text-gray-600">{org.province}, {org.district}</div>
                          </div>
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Approved
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showSuggestions && searchTerm && filteredOrganizations.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-3 text-gray-500">
                      No organizations found matching "{searchTerm}"
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Type to search by organization name, province or district
                  </span>
                </div>
              </div>
              
              {selectedOrganization && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Selected Organization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Name:</p>
                      <p className="text-gray-800">{selectedOrganization.institution_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Location:</p>
                      <p className="text-gray-800">{selectedOrganization.province}, {selectedOrganization.district}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Contact Person:</p>
                      <p className="text-gray-800">{selectedOrganization.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">Status:</p>
                      <p className="text-gray-800">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Service Information Section */}
            {selectedOrganization && (
              <div className="relative pt-6">
                <div className="absolute -top-4 -left-2 bg-indigo-500 text-white px-4 py-1 rounded-full shadow-md">
                  <span className="text-lg font-medium">Step 2: Add Services</span>
                </div>
                
                <div className="space-y-6 mt-4">
                  {services.map((service, index) => (
                    <div key={index} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                          <span className="flex items-center justify-center bg-indigo-100 text-indigo-600 w-6 h-6 rounded-full mr-2">
                            {index + 1}
                          </span>
                          Service {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          disabled={services.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Service Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Web Development"
                            value={service.serviceName}
                            onChange={(e) => handleServiceChange(index, 'serviceName', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Category *</label>
                          <input
                            type="text"
                            placeholder="e.g. IT Services"
                            value={service.category}
                            onChange={(e) => handleServiceChange(index, 'category', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Description *</label>
                          <textarea
                            placeholder="Describe the service you offer..."
                            value={service.description}
                            onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            rows="3"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Requirements *</label>
                          <textarea
                            placeholder="List any requirements for this service..."
                            value={service.requirements}
                            onChange={(e) => handleServiceChange(index, 'requirements', e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            rows="3"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addService}
                    className="flex items-center justify-center w-full py-3 border-2 border-dashed border-indigo-300 rounded-md hover:bg-indigo-50 transition-colors group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-indigo-600 font-medium group-hover:text-indigo-800">Add Another Service</span>
                  </button>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-4 rounded-md text-lg font-medium shadow-lg transition-all transform hover:scale-[1.02] ${
                        isSubmitting 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        'Submit Services for Approval'
                      )}
                    </button>
                    
                    <div className="mt-4 text-center">
                      <div className="bg-yellow-50 rounded-lg p-3 inline-block">
                        <p className="text-sm text-yellow-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Services will be reviewed by an administrator before being published
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default ServiceForm;