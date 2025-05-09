import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { provinces, getDistricts } from '../utils/locationData';
import organizationService from '../services/organizationService';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';

const OrganizationEdit = ({ isPending = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [services, setServices] = useState([]);
  
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
    const fetchOrganizationDetails = async () => {
      try {
        setLoading(true);
        
        const response = await organizationService.getOrganizationById(id);
        
        const organization = response.data;
        
        if (organization.status !== 'pending') {
          toast.error('Only pending organizations can be edited');
          navigate(`/organizations/${id}/details`);
          return;
        }

        // Set districts based on province
        if (organization.province) {
          setDistricts(getDistricts(organization.province));
        }

        // Map organization data to form fields
        setFormData({
          province: organization.province || '',
          district: organization.district || '',
          institutionName: organization.institution_name || '',
          websiteUrl: organization.website_url || '',
          personalDetails: {
            name: organization.name || '',
            designation: organization.designation || '',
            email: organization.email || '',
            contactNumber: organization.contact_number || ''
          },
          organizationLogo: null,
          organizationLogoUrl: organization.organization_logo || '',
          profileImage: null,
          profileImageUrl: organization.profile_image || ''
        });

        // Set services
        if (organization.services && organization.services.length > 0) {
          setServices(organization.services.map(service => ({
            id: service.id,
            serviceName: service.serviceName || '',
            category: service.category || '',
            description: service.description || '',
            requirements: service.requirements || ''
          })));
        } else {
          setServices([{
            serviceName: '',
            category: '',
            description: '',
            requirements: ''
          }]);
        }

        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch organization details');
        toast.error('Failed to load organization details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationDetails();
  }, [id, navigate]);

  useEffect(() => {
    if (formData.province) {
      const districtList = getDistricts(formData.province);
      setDistricts(districtList);
      // Reset district when province changes
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
      [`${type}Url`]: '' // Clear URL when file is selected
    }));
  };

  const handleImageUrlChange = (e) => {
    const { name, value } = e.target;
    const fileType = name === 'organizationLogoUrl' ? 'organizationLogo' : 'profileImage';
    setFormData(prev => ({
      ...prev,
      [name]: value,
      [fileType]: null // Clear file when URL is entered
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate form data
      if (!formData.province || !formData.district || !formData.institutionName) {
        toast.error('Please fill in all required organization details');
        return;
      }

      if (!formData.personalDetails.name || !formData.personalDetails.designation || 
          !formData.personalDetails.email || !formData.personalDetails.contactNumber) {
        toast.error('Please fill in all required personal details');
        return;
      }

      if (!services[0].serviceName || !services[0].category || 
          !services[0].description || !services[0].requirements) {
        toast.error('Please fill in at least one service details');
        return;
      }

      // Prepare data for submission
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
        services: services
      };

      // Submit form
      await organizationService.updateOrganization(id, organizationData);
      
      toast.success('Organization updated successfully!');
      navigate(`/organizations/${id}/details`);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message || 'Error updating organization details');
    } finally {
      setSubmitting(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="text-red-500">{error}</div>
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
        <div className="px-4 sm:px-0">
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {isPending ? 'Edit Pending Organization' : 'Edit Organization'}
              </h2>
              <button
                onClick={() => navigate(`/organizations/${id}/details`)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
            <p className="text-yellow-600 mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              You can only edit organizations with pending status. Once approved or rejected, you can't make changes.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Organization Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <select
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select Province</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>

              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
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

              <input
                type="text"
                name="institutionName"
                placeholder="Institution Name"
                value={formData.institutionName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />

              <input
                type="url"
                name="websiteUrl"
                placeholder="Website URL"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <h2 className="text-2xl font-bold mb-6">Personal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                name="personalDetails.name"
                placeholder="Your Name"
                value={formData.personalDetails.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />

              <input
                type="text"
                name="personalDetails.designation"
                placeholder="Designation"
                value={formData.personalDetails.designation}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />

              <input
                type="email"
                name="personalDetails.email"
                placeholder="Email"
                value={formData.personalDetails.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />

              <input
                type="tel"
                name="personalDetails.contactNumber"
                placeholder="Contact Number"
                value={formData.personalDetails.contactNumber}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Organization Logo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">Upload Logo File</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'organizationLogo')}
                      accept="image/*"
                      className="w-full p-2 border rounded-md"
                      disabled={formData.organizationLogoUrl}
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Or Enter Logo URL</label>
                    <input
                      type="url"
                      name="organizationLogoUrl"
                      placeholder="Enter image URL"
                      value={formData.organizationLogoUrl}
                      onChange={handleImageUrlChange}
                      className="w-full p-2 border rounded-md"
                      disabled={formData.organizationLogo}
                    />
                  </div>
                  {formData.organizationLogoUrl && (
                    <div className="md:col-span-2">
                      <img 
                        src={formData.organizationLogoUrl}
                        alt="Organization Logo Preview" 
                        className="h-20 object-contain"
                        onError={(e) => e.target.style.display = 'none'} 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Photo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">Upload Profile Photo</label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'profileImage')}
                      accept="image/*"
                      className="w-full p-2 border rounded-md"
                      disabled={formData.profileImageUrl}
                    />
                  </div>
                  <div>
                    <label className="block mb-2">Or Enter Photo URL</label>
                    <input
                      type="url"
                      name="profileImageUrl"
                      placeholder="Enter image URL"
                      value={formData.profileImageUrl}
                      onChange={handleImageUrlChange}
                      className="w-full p-2 border rounded-md"
                      disabled={formData.profileImage}
                    />
                  </div>
                  {formData.profileImageUrl && (
                    <div className="md:col-span-2">
                      <img 
                        src={formData.profileImageUrl}
                        alt="Profile Photo Preview" 
                        className="h-20 object-contain"
                        onError={(e) => e.target.style.display = 'none'} 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Service Information</h2>
            {services.map((service, index) => (
              <div key={index} className="p-4 border rounded-md space-y-4">
                <input
                  type="text"
                  placeholder="Service Name"
                  value={service.serviceName}
                  onChange={(e) => handleServiceChange(index, 'serviceName', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                />

                <input
                  type="text"
                  placeholder="Category"
                  value={service.category}
                  onChange={(e) => handleServiceChange(index, 'category', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                />

                <textarea
                  placeholder="Description"
                  value={service.description}
                  onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows="4"
                  required
                />

                <textarea
                  placeholder="Requirements"
                  value={service.requirements}
                  onChange={(e) => handleServiceChange(index, 'requirements', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows="4"
                  required
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addService}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              + Add Another Service
            </button>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate(`/organizations/${id}/details`)}
                className="w-1/2 py-3 rounded-md bg-gray-500 hover:bg-gray-600 text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`w-1/2 py-3 rounded-md transition-colors ${
                  submitting 
                    ? 'bg-green-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrganizationEdit;