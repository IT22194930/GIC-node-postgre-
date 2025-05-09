import React, { useState, useEffect } from 'react';
import { provinces, getDistricts } from '../utils/locationData';
import organizationService from '../services/organizationService';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_API_URL; // e.g. "http://localhost:3000"

const OrganizationForm = () => {
  const [districts, setDistricts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState([{
    serviceName: '',
    category: '',
    description: '',
    requirements: ''
  }]);
  const [pdfUrl, setPdfUrl] = useState('');  // full URL to PDF

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
      const list = getDistricts(formData.province);
      setDistricts(list);
      if (!list.includes(formData.district)) {
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
        personalDetails: { ...prev.personalDetails, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
    setIsSubmitting(true);

    try {
      // Validate
      if (!formData.province || !formData.district || !formData.institutionName) {
        toast.error('Please fill in all required organization details');
        return;
      }
      const pd = formData.personalDetails;
      if (!pd.name || !pd.designation || !pd.email || !pd.contactNumber) {
        toast.error('Please fill in all required personal details');
        return;
      }
      if (!services[0].serviceName || !services[0].category ||
          !services[0].description || !services[0].requirements) {
        toast.error('Please fill in at least one service');
        return;
      }

      // Prepare payload
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
        services
      };

      // Call API
      const { pdfPath } = await organizationService.createOrganization(organizationData);

      // Build full URL and open
      const fullPdfUrl = `${BACKEND_URL}${pdfPath}`;
      window.open(fullPdfUrl, '_blank');
      setPdfUrl(fullPdfUrl);

      toast.success('Registration submitted! Your PDF is opening now.', { autoClose: 5000 });

      // Reset form
      setFormData({
        province: '',
        district: '',
        institutionName: '',
        websiteUrl: '',
        personalDetails: { name: '', designation: '', email: '', contactNumber: '' },
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
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Error submitting organization details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-white">Organization Registration</h1>
        <p className="text-blue-100 mt-2">
          Fill out the form below to register your organization. Once submitted, a PDF summary will open automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-b-lg shadow-lg p-8 space-y-8 border-t-0">
        {/* Step 1 */}
        <div className="relative border-b pb-8 pt-6">
          <div className="absolute -top-4 -left-2 bg-blue-500 text-white px-4 py-1 rounded-full">
            Step 1: Organization Details
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
              <label>Province *</label>
              <select
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded"
              >
                <option value="">Select Province</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label>District *</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                required
                disabled={!formData.province}
                className="w-full p-3 border rounded"
              >
                <option value="">Select District</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label>Institution Name *</label>
              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded"
                placeholder="Enter your institution name"
              />
            </div>
            <div>
              <label>Website URL</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                className="w-full p-3 border rounded"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative border-b pb-8 pt-6">
          <div className="absolute -top-4 -left-2 bg-green-500 text-white px-4 py-1 rounded-full">
            Step 2: Contact Information
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
              <label>Full Name *</label>
              <input
                type="text"
                name="personalDetails.name"
                value={formData.personalDetails.name}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label>Designation *</label>
              <input
                type="text"
                name="personalDetails.designation"
                value={formData.personalDetails.designation}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded"
                placeholder="Your title"
              />
            </div>
            <div>
              <label>Email Address *</label>
              <input
                type="email"
                name="personalDetails.email"
                value={formData.personalDetails.email}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label>Contact Number *</label>
              <input
                type="tel"
                name="personalDetails.contactNumber"
                value={formData.personalDetails.contactNumber}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded"
                placeholder="Your phone number"
              />
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative border-b pb-8 pt-6">
          <div className="absolute -top-4 -left-2 bg-purple-500 text-white px-4 py-1 rounded-full">
            Step 3: Branding & Images
          </div>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label>Upload Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'organizationLogo')}
                  disabled={formData.organizationLogoUrl}
                  className="w-full"
                />
                {formData.organizationLogo && <p>Selected: {formData.organizationLogo.name}</p>}
              </div>
              <div>
                <label>Or Logo URL</label>
                <input
                  type="url"
                  name="organizationLogoUrl"
                  value={formData.organizationLogoUrl}
                  onChange={handleImageUrlChange}
                  disabled={formData.organizationLogo}
                  className="w-full p-3 border rounded"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label>Upload Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'profileImage')}
                  disabled={formData.profileImageUrl}
                  className="w-full"
                />
                {formData.profileImage && <p>Selected: {formData.profileImage.name}</p>}
              </div>
              <div>
                <label>Or Photo URL</label>
                <input
                  type="url"
                  name="profileImageUrl"
                  value={formData.profileImageUrl}
                  onChange={handleImageUrlChange}
                  disabled={formData.profileImage}
                  className="w-full p-3 border rounded"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="relative pb-8 pt-6">
          <div className="absolute -top-4 -left-2 bg-orange-500 text-white px-4 py-1 rounded-full">
            Step 4: Services Offered
          </div>
          <div className="space-y-6">
            {services.map((svc, idx) => (
              <div key={idx} className="border p-4 rounded">
                <div className="flex justify-between items-center">
                  <h4>Service {idx + 1}</h4>
                  <button type="button" onClick={() => removeService(idx)}>
                    Remove
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <input
                    type="text"
                    placeholder="Service Name"
                    value={svc.serviceName}
                    onChange={e => handleServiceChange(idx, 'serviceName', e.target.value)}
                    required
                    className="p-3 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={svc.category}
                    onChange={e => handleServiceChange(idx, 'category', e.target.value)}
                    required
                    className="p-3 border rounded"
                  />
                </div>
                <textarea
                  placeholder="Description"
                  value={svc.description}
                  onChange={e => handleServiceChange(idx, 'description', e.target.value)}
                  required
                  className="w-full p-3 border rounded mt-2"
                  rows={3}
                />
                <textarea
                  placeholder="Requirements"
                  value={svc.requirements}
                  onChange={e => handleServiceChange(idx, 'requirements', e.target.value)}
                  required
                  className="w-full p-3 border rounded mt-2"
                  rows={3}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addService}
              className="w-full py-2 border-dashed border-2 rounded"
            >
              + Add Another Service
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded text-white ${
              isSubmitting ? 'bg-gray-400' : 'bg-blue-600'
            }`}
          >
            {isSubmitting ? 'Processing…' : 'Save Registration'}
          </button>
        </div>
      </form>

      {/* Persistent PDF link */}
      {pdfUrl && (
        <div className="mt-6 text-center">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600"
          >
            📄 Download your registration PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default OrganizationForm;
