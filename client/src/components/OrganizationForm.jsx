import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { provinces, getDistricts } from '../utils/locationData';

const OrganizationForm = () => {
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
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
    
    // Create form data for file upload
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'organizationLogo' || key === 'profileImage') {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else {
          // If no file is selected, use the URL
          formDataToSend.append(`${key}Url`, formData[`${key}Url`]);
        }
      } else if (key === 'personalDetails') {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (!key.endsWith('Url')) { // Skip URL fields as they're handled with their corresponding file fields
        formDataToSend.append(key, formData[key]);
      }
    });
    formDataToSend.append('services', JSON.stringify(services));

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
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

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
      >
        Submit Form
      </button>
    </form>
  );
};

export default OrganizationForm; 