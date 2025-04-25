import React, { useState, useEffect } from 'react';
import { provinces, getDistricts } from '../utils/locationData';
import pendingOrganizationService from '../services/pendingOrganizationService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const OrganizationForm = () => {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState('organization'); // 'organization' or 'services'
  const [organizationId, setOrganizationId] = useState(null);
  const [skipServices, setSkipServices] = useState(false);
  const [services, setServices] = useState([{
    serviceName: '',
    category: '',
    description: '',
    requirements: ''
  }]);

  const [formData, setFormData] = useState({
    province: '',
    district: '',
    institutionName: '',
    websiteUrl: '',
    personalDetails: {
      name: '',
      designation: '',
      email: '',
      contactNumber: ''
    },
    organizationLogo: null,
    organizationLogoUrl: '',
    profileImage: null,
    profileImageUrl: ''
  });

  useEffect(() => {
    if (formData.province) {
      const districtList = getDistricts(formData.province);
      setDistricts(districtList);
      if (!districtList.includes(formData.district)) {
        setFormData(prev => ({ ...prev, district: '' }));
      }
    } else {
      setDistricts([]);
    }
  }, [formData.province]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('personalDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      [type]: file,
      [`${type}Url`]: ''
    }));
  };

  const handleImageUrlChange = (e) => {
    const { name, value } = e.target;
    const fileType = name === 'organizationLogoUrl' ? 'organizationLogo' : 'profileImage';
    setFormData(prev => ({
      ...prev,
      [name]: value,
      [fileType]: null
    }));
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
    // Don't allow removing the last service
    if (services.length <= 1) return;
    
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const handleOrganizationSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      if (!formData.province || !formData.district || !formData.institutionName) {
        toast.error('Please fill in all required organization details');
        return;
      }

      if (!formData.personalDetails.name || !formData.personalDetails.designation || 
          !formData.personalDetails.email || !formData.personalDetails.contactNumber) {
        toast.error('Please fill in all required personal details');
        return;
      }

      const organizationData = {
        province: formData.province,
        district: formData.district,
        institutionName: formData.institutionName,
        websiteUrl: formData.websiteUrl,
        personalDetails: formData.personalDetails,
        organizationLogo: formData.organizationLogo,
        organizationLogoUrl: formData.organizationLogoUrl,
        profileImage: formData.profileImage,
        profileImageUrl: formData.profileImageUrl,
        services: [] // Empty services array for initial submission
      };

      const response = await pendingOrganizationService.createPendingOrganization(organizationData);
      toast.success('Organization details saved! Now let\'s add services.');
      
      // Store the organization ID and move to services step
      setOrganizationId(response.data.organization.id);
      setCurrentStep('services');
      
      // Scroll to the top of the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Organization submission error:', error);
      toast.error(error.message || 'Error submitting organization details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServicesSubmit = async (e, isSkipping = false) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      // Only validate services if not skipping
      if (!isSkipping && (!services[0].serviceName || !services[0].category || 
          !services[0].description || !services[0].requirements)) {
        toast.error('Please fill in at least one service details or skip adding services');
        return;
      }

      // Update the organization with services
      const organizationData = {
        services: isSkipping ? [] : services
      };

      await pendingOrganizationService.updatePendingOrganization(organizationId, organizationData);
      toast.success('Organization saved successfully!');
      
      // Reset form
      setFormData({
        province: '',
        district: '',
        institutionName: '',
        websiteUrl: '',
        personalDetails: {
          name: '',
          designation: '',
          email: '',
          contactNumber: ''
        },
        organizationLogo: null,
        organizationLogoUrl: '',
        profileImage: null,
        profileImageUrl: ''
      });
      
      setServices([{
        serviceName: '',
        category: '',
        description: '',
        requirements: ''
      }]);
      
      setCurrentStep('organization');
      setOrganizationId(null);
      
      // Reload page to show the new organization in the list
      setTimeout(() => {
        window.location.reload();
      }, 1500); // Small delay to ensure toast message is visible
      
    } catch (error) {
      console.error('Services submission error:', error);
      toast.error(error.message || 'Error submitting service details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-white">Organization Registration</h1>
        {currentStep === 'organization' ? (
          <p className="text-blue-100 mt-2">Step 1: Fill out organization details below. After submitting, you'll be able to add services.</p>
        ) : (
          <p className="text-blue-100 mt-2">Step 2: Add services for your organization.</p>
        )}
      </div>
      
      {currentStep === 'organization' ? (
        <form onSubmit={handleOrganizationSubmit} className="bg-white rounded-b-lg shadow-lg p-8 space-y-8 border-t-0">
          {/* Organization Details Section */}
          <div className="relative border-b pb-8 pt-6">
            <div className="absolute -top-4 -left-2 bg-blue-500 text-white px-4 py-1 rounded-full shadow-md">
              <span className="text-lg font-medium">Organization Details</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Province *</label>
                <select
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">Select Province</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">District *</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  disabled={!formData.province}
                >
                  <option value="">Select District</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Institution Name *</label>
                <input
                  type="text"
                  name="institutionName"
                  placeholder="Enter your institution name"
                  value={formData.institutionName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Website URL</label>
                <input
                  type="url"
                  name="websiteUrl"
                  placeholder="https://example.com"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="relative border-b pb-8 pt-6">
            <div className="absolute -top-4 -left-2 bg-green-500 text-white px-4 py-1 rounded-full shadow-md">
              <span className="text-lg font-medium">Contact Information</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  name="personalDetails.name"
                  placeholder="Your full name"
                  value={formData.personalDetails.name}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Designation *</label>
                <input
                  type="text"
                  name="personalDetails.designation"
                  placeholder="Your position/title"
                  value={formData.personalDetails.designation}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  name="personalDetails.email"
                  placeholder="your.email@example.com"
                  value={formData.personalDetails.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Contact Number *</label>
                <input
                  type="tel"
                  name="personalDetails.contactNumber"
                  placeholder="Your phone number"
                  value={formData.personalDetails.contactNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Organization Images Section */}
          <div className="relative border-b pb-8 pt-6">
            <div className="absolute -top-4 -left-2 bg-purple-500 text-white px-4 py-1 rounded-full shadow-md">
              <span className="text-lg font-medium">Branding & Images</span>
            </div>

            <div className="space-y-8 ">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Organization Logo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-40 cursor-pointer hover:border-blue-500 transition-colors">
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600">Click to upload logo</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'organizationLogo')}
                        accept="image/*"
                        className="hidden"
                        disabled={formData.organizationLogoUrl}
                      />
                    </label>
                    {formData.organizationLogo && (
                      <p className="mt-2 text-sm text-green-600">
                        File selected: {formData.organizationLogo.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Or Enter Logo URL</label>
                    <input
                      type="url"
                      name="organizationLogoUrl"
                      placeholder="https://example.com/logo.png"
                      value={formData.organizationLogoUrl}
                      onChange={handleImageUrlChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={formData.organizationLogo}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Professional Photo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-40 cursor-pointer hover:border-blue-500 transition-colors">
                      <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-600">Click to upload photo</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'profileImage')}
                        accept="image/*"
                        className="hidden"
                        disabled={formData.profileImageUrl}
                      />
                    </label>
                    {formData.profileImage && (
                      <p className="mt-2 text-sm text-green-600">
                        File selected: {formData.profileImage.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Or Enter Photo URL</label>
                    <input
                      type="url"
                      name="profileImageUrl"
                      placeholder="https://example.com/photo.jpg"
                      value={formData.profileImageUrl}
                      onChange={handleImageUrlChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={formData.profileImage}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-md text-lg font-medium shadow-lg transition-all transform hover:scale-[1.02] ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
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
                <div className="flex items-center justify-center">
                  <span>Continue to Services</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              )}
            </button>
            
            <p className="mt-4 text-center text-sm text-gray-600">
              By submitting this form, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => handleServicesSubmit(e)} className="bg-white rounded-b-lg shadow-lg p-8 space-y-8 border-t-0">
          {/* Service Information Section */}
          <div className="relative pb-8 pt-6">
            <div className="absolute -top-4 -left-2 bg-orange-500 text-white px-4 py-1 rounded-full shadow-md">
              <span className="text-lg font-medium">Services Offered</span>
            </div>
            
            <div className="space-y-6">
              {services.map((service, index) => (
                <div key={index} className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <span className="flex items-center justify-center bg-orange-100 text-orange-600 w-6 h-6 rounded-full mr-2">
                        {index + 1}
                      </span>
                      Service {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                className="flex items-center justify-center w-full py-3 border-2 border-dashed border-blue-300 rounded-md hover:bg-blue-50 transition-colors group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-blue-600 font-medium group-hover:text-blue-800">Add Another Service</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 flex flex-col md:flex-row md:space-x-4">
            <button
              type="button"
              onClick={() => {
                if (confirm("Going back will discard your organization. Are you sure?")) {
                  setCurrentStep('organization');
                  setOrganizationId(null);
                }
              }}
              className="w-full md:w-1/3 py-4 mb-4 md:mb-0 rounded-md text-lg font-medium shadow-lg transition-all bg-gray-500 hover:bg-gray-600 text-white"
            >
              Go Back
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full md:w-2/3 py-4 rounded-md text-lg font-medium shadow-lg transition-all transform hover:scale-[1.02] ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
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
                <div className="flex items-center justify-center">
                  <span>Save Services</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          </div>
          
          <div className="pt-4">
            <button
              type="button"
              onClick={(e) => {
                setSkipServices(true);
                handleServicesSubmit(e, true);
              }}
              className="w-full py-4 rounded-md text-lg font-medium shadow-lg transition-all transform hover:scale-[1.02] bg-gray-500 hover:bg-gray-600 text-white"
            >
              Skip Adding Services
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600">
            By submitting this form, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      )}
    </div>
  );
};

export default OrganizationForm;