import React, { useState, useEffect } from 'react';
import { provinces, getDistricts } from '../utils/locationData';
import organizationService from '../services/organizationService';
import { toast } from 'react-toastify';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../config/firebase';

const BACKEND_URL = import.meta.env.VITE_API_URL; // e.g. "http://localhost:3000"

const OrganizationForm = () => {
  const [districts, setDistricts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUploading, setFileUploading] = useState({
    logo: false,
    profile: false
  });
  const [services, setServices] = useState([{
    serviceName: '',
    category: '',
    description: '',
    requirements: ''
  }]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [docxUrl, setDocxUrl] = useState('');
  const [firebasePdfUrl, setFirebasePdfUrl] = useState('');
  const [firebaseDocxUrl, setFirebaseDocxUrl] = useState('');

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
      
      // Special handling for contact number - limit to 10 numeric digits
      if (field === 'contactNumber') {
        // Allow only numeric input and limit to 10 digits
        const numericValue = value.replace(/\D/g, '');
        const limitedValue = numericValue.slice(0, 10);
        
        setFormData(prev => ({
          ...prev,
          personalDetails: { ...prev.personalDetails, [field]: limitedValue }
        }));
      } else {
        // Regular handling for other personal details fields
        setFormData(prev => ({
          ...prev,
          personalDetails: { ...prev.personalDetails, [field]: value }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Set fileUploading state for the specific file type
    setFileUploading(prev => ({
      ...prev,
      [type === 'organizationLogo' ? 'logo' : 'profile']: true
    }));

    try {
      // Create a unique filename
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${type}_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `organizations/images/${fileName}`);
      
      // Upload the file to Firebase Storage
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update form data with the Firebase URL
      setFormData(prev => ({
        ...prev,
        [type]: null,
        [`${type}Url`]: downloadURL
      }));

      toast.success(`${type === 'organizationLogo' ? 'Logo' : 'Profile image'} uploaded successfully!`);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload ${type === 'organizationLogo' ? 'logo' : 'profile image'}.`);
    } finally {
      // Clear loading state
      setFileUploading(prev => ({
        ...prev,
        [type === 'organizationLogo' ? 'logo' : 'profile']: false
      }));
    }
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
        organizationLogoUrl: formData.organizationLogoUrl, // This is now the Firebase URL
        profileImageUrl: formData.profileImageUrl, // This is now the Firebase URL
        services
      };

      try {
        // Call API
        const response = await organizationService.createOrganization(organizationData);
        
        // Set Firebase URLs if available
        if (response.firebasePdfUrl) {
          setFirebasePdfUrl(response.firebasePdfUrl);
          // Open the PDF in a new tab
          window.open(response.firebasePdfUrl, '_blank');
          toast.success('Registration submitted! Your PDF is opening now.', { autoClose: 5000 });
        } else if (response.firebaseDocxUrl) {
          setFirebaseDocxUrl(response.firebaseDocxUrl);
          toast.success('Registration submitted! Your DOCX file is available for download.', { autoClose: 5000 });
        } 
        // Fallback to local server paths if Firebase URLs are not available
        else if (response.pdfPath) {
          const fullPdfUrl = `${BACKEND_URL}${response.pdfPath}`;
          setPdfUrl(fullPdfUrl);
          window.open(fullPdfUrl, '_blank');
          toast.success('Registration submitted! Your PDF is opening now.', { autoClose: 5000 });
        } else if (response.docxPath) {
          // Fallback to DOCX if PDF generation failed
          const fullDocxUrl = `${BACKEND_URL}${response.docxPath}`;
          setDocxUrl(fullDocxUrl);
          toast.success('Registration submitted! Your DOCX file is available for download.', { autoClose: 5000 });
        }

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
        console.error('API error:', err);
        
        // Special handling for LibreOffice missing error
        if (err.error && err.error.includes('soffice: command not found')) {
          toast.error('Registration submitted, but PDF generation failed. LibreOffice not found on server.', { autoClose: 7000 });
          toast.info('Your data has been saved. Please contact the administrator about installing LibreOffice.', { autoClose: 7000 });
        } else {
          toast.error(err.message || 'Error submitting organization details');
        }
      }
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
              <label>Contact Number * (10 digits)</label>
              <input
                type="tel"
                name="personalDetails.contactNumber"
                value={formData.personalDetails.contactNumber}
                onChange={handleInputChange}
                required
                pattern="[0-9]{10}"
                maxLength="10"
                className="w-full p-3 border rounded"
                placeholder="Your phone number"
                onKeyPress={(e) => {
                  // Allow only numeric input
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
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
                <label className="block mb-2">Organization Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'organizationLogo')}
                  className="w-full p-2 border rounded"
                />
                {fileUploading.logo && (
                  <div className="mt-2 flex items-center text-blue-600">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </div>
                )}
                {formData.organizationLogoUrl && (
                  <div className="mt-2">
                    <img 
                      src={formData.organizationLogoUrl} 
                      alt="Organization Logo Preview" 
                      className="h-20 object-contain border rounded p-1"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/150?text=Logo+Preview';
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block mb-2">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileChange(e, 'profileImage')}
                  className="w-full p-2 border rounded"
                />
                {fileUploading.profile && (
                  <div className="mt-2 flex items-center text-blue-600">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </div>
                )}
                {formData.profileImageUrl && (
                  <div className="mt-2">
                    <img 
                      src={formData.profileImageUrl} 
                      alt="Profile Image Preview" 
                      className="h-20 object-contain border rounded p-1"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/150?text=Profile+Preview';
                      }}
                    />
                  </div>
                )}
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
            disabled={isSubmitting || fileUploading.logo || fileUploading.profile}
            className={`w-full py-3 rounded text-white ${
              isSubmitting || fileUploading.logo || fileUploading.profile ? 'bg-gray-400' : 'bg-blue-600'
            }`}
          >
            {isSubmitting ? 'Processing…' : 'Save Registration'}
          </button>
        </div>
      </form>

      {/* Persistent document links */}
      {(firebasePdfUrl || firebaseDocxUrl || pdfUrl || docxUrl) && (
        <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <h3 className="font-medium text-blue-700 mb-2">Your Documents</h3>
          
          {firebasePdfUrl && (
            <a
              href={firebasePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Download Registration PDF (Cloud Storage)
            </a>
          )}
          
          {firebaseDocxUrl && (
            <a
              href={firebaseDocxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Download Registration DOCX (Cloud Storage)
            </a>
          )}
          
          {/* Fallback to local server paths if Firebase URLs are not available */}
          {!firebasePdfUrl && pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Download Registration PDF (Local Server)
            </a>
          )}
          
          {!firebaseDocxUrl && docxUrl && (
            <a
              href={docxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Download Registration DOCX (Local Server)
            </a>
          )}
          
          {!firebasePdfUrl && !firebaseDocxUrl && !pdfUrl && !docxUrl && (
            <p className="text-amber-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              If you need your registration document, please contact the administrator.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationForm;
