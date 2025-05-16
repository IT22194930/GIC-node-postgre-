import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import organizationService from '../services/organizationService';
import servicesService from '../services/servicesService';

const ServiceForm = () => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState([{
    serviceName: '', category: '', description: '', requirements: ''
  }]);

  useEffect(() => {
    fetchUserOrganizations();
  }, []);

  const fetchUserOrganizations = async () => {
    setIsLoading(true);
    try {
      const response = await organizationService.getUserOrganizations();
      // Only show approved organizations
      const approvedOrgs = response.data.filter(org => org.status === 'approved');
      setOrganizations(approvedOrgs);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load your organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrganizationChange = (e) => {
    setSelectedOrganization(e.target.value);
  };

  const handleServiceChange = (index, field, value) => {
    setServices(prev =>
      prev.map((svc, i) => (i === index ? { ...svc, [field]: value } : svc))
    );
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
    if (services.length <= 1) return;
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOrganization) {
      toast.error('Please select an organization');
      return;
    }

    if (!services[0].serviceName || !services[0].category ||
        !services[0].description || !services[0].requirements) {
      toast.error('Please fill in at least one service');
      return;
    }

    setIsSubmitting(true);

    try {
      // Process each service
      for (const service of services) {
        const serviceData = {
          organization_id: selectedOrganization,
          serviceName: service.serviceName,
          category: service.category,
          description: service.description,
          requirements: service.requirements
        };

        await servicesService.createService(serviceData);
      }

      toast.success('Services added successfully!');
      
      // Reset form
      setSelectedOrganization('');
      setServices([{
        serviceName: '',
        category: '',
        description: '',
        requirements: ''
      }]);
    } catch (error) {
      console.error('Error adding services:', error);
      toast.error(error.message || 'Failed to add services');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto my-6">
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-lg p-6 shadow-lg">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white ml-3">Add Services to Organization</h1>
        </div>
        <p className="text-green-100">
          Add new services to your approved organizations. Select an organization and define the services you offer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-b-lg shadow-lg p-6 border-t-0">
        {/* Organization Selection */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="inline-flex items-center bg-blue-600 text-white px-4 py-1 rounded-full font-medium text-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            Step 1: Select Organization
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading organizations...</span>
            </div>
          ) : organizations.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
              <div className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">No approved organizations found</p>
                  <p className="text-sm mt-1">Please register an organization first and wait for admin approval.</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-gray-700 font-medium block mb-2">Select an Organization *</label>
              <select
                value={selectedOrganization}
                onChange={handleOrganizationChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:border-blue-400 bg-white"
              >
                <option value="">-- Select an organization --</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.institution_name} ({org.province}, {org.district})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Services Input */}
        <div className="mb-6">
          <div className="inline-flex items-center bg-green-600 text-white px-4 py-1 rounded-full font-medium text-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            Step 2: Define Services
          </div>
          <div className="space-y-4">
            {services.map((svc, idx) => (
              <div key={idx} className="border border-gray-200 p-4 rounded bg-white shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-base font-medium text-green-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7zm0 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Service {idx + 1}
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => removeService(idx)}
                    className="text-red-500 hover:text-red-700 bg-red-50 rounded-full p-1"
                    disabled={services.length <= 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-gray-700 font-medium block mb-1">Service Name *</label>
                    <input
                      type="text"
                      placeholder="Service Name"
                      value={svc.serviceName}
                      onChange={e => handleServiceChange(idx, 'serviceName', e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-green-300 focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-medium block mb-1">Category *</label>
                    <input
                      type="text"
                      placeholder="Category"
                      value={svc.category}
                      onChange={e => handleServiceChange(idx, 'category', e.target.value)}
                      required
                      className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-green-300 focus:border-green-400"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-gray-700 font-medium block mb-1">Description *</label>
                  <textarea
                    placeholder="Provide a detailed description of the service"
                    value={svc.description}
                    onChange={e => handleServiceChange(idx, 'description', e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-green-300 focus:border-green-400"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-gray-700 font-medium block mb-1">Requirements *</label>
                  <textarea
                    placeholder="List any requirements for this service"
                    value={svc.requirements}
                    onChange={e => handleServiceChange(idx, 'requirements', e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:ring focus:ring-green-300 focus:border-green-400"
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addService}
              className="w-full py-2 border-dashed border-2 border-green-300 rounded hover:border-green-500 hover:bg-green-50 flex items-center justify-center text-green-600 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Add Another Service
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting || organizations.length === 0}
            className={`w-full py-3 rounded text-white font-bold shadow ${
              isSubmitting || organizations.length === 0
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting Services...
              </div>
            ) : 'Submit Services'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;