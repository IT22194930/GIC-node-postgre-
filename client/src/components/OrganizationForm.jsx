import React, { useState, useEffect } from 'react';
import { provinces, getDistricts } from '../utils/locationData';
import organizationService from '../services/organizationService';
import { toast } from 'react-toastify';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from '../config/firebase';

const BACKEND_URL = import.meta.env.VITE_API_URL;

const OrganizationForm = ({ onOrganizationCreated }) => {
  const [districts, setDistricts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUploading, setFileUploading] = useState({ logo: false, profile: false });
  const [pdfUrl, setPdfUrl] = useState('');
  const [docxUrl, setDocxUrl] = useState('');
  const [firebasePdfUrl, setFirebasePdfUrl] = useState('');
  const [firebaseDocxUrl, setFirebaseDocxUrl] = useState('');
  const [newlyCreatedOrg, setNewlyCreatedOrg] = useState(null);
  const [formData, setFormData] = useState({
    province: '', district: '', institutionName: '', websiteUrl: '',
    personalDetails: { name: '', designation: '', email: '', contactNumber: '' },
    organizationLogo: null, organizationLogoUrl: '',
    profileImage: null, profileImageUrl: ''
  });
  const [imagePreview, setImagePreview] = useState({
    organizationLogo: null,
    profileImage: null
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
  }, [formData.province, formData.district]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('personalDetails.')) {
      const field = name.split('.')[1];
      
      if (field === 'contactNumber') {
        const numericValue = value.replace(/\D/g, '');
        const limitedValue = numericValue.slice(0, 10);
        setFormData(prev => ({
          ...prev,
          personalDetails: { ...prev.personalDetails, [field]: limitedValue }
        }));
      } else if (field === 'name') {
        const sanitizedValue = value.replace(/[^A-Za-z\s.]/g, '');
        setFormData(prev => ({
          ...prev,
          personalDetails: { ...prev.personalDetails, [field]: sanitizedValue }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          personalDetails: { ...prev.personalDetails, [field]: value }
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setFormData(prev => ({
      ...prev,
      [type]: file
    }));
    
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(prev => ({
      ...prev,
      [type]: previewUrl
    }));
  };

  const uploadImagesToFirebase = async () => {
    const uploads = [];
    const newFormData = { ...formData };
    
    if (formData.organizationLogo) {
      setFileUploading(prev => ({ ...prev, logo: true }));
      const timestamp = new Date().getTime();
      const fileExtension = formData.organizationLogo.name.split('.').pop();
      const fileName = `organizationLogo_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `organizations/images/${fileName}`);
      
      const logoUpload = uploadBytes(storageRef, formData.organizationLogo)
        .then(() => getDownloadURL(storageRef))
        .then(downloadURL => {
          newFormData.organizationLogoUrl = downloadURL;
          return true;
        })
        .catch(error => {
          console.error("Error uploading organization logo:", error);
          toast.error("Failed to upload organization logo");
          return false;
        });
        
      uploads.push(logoUpload);
    }
    
    if (formData.profileImage) {
      setFileUploading(prev => ({ ...prev, profile: true }));
      const timestamp = new Date().getTime();
      const fileExtension = formData.profileImage.name.split('.').pop();
      const fileName = `profileImage_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `organizations/images/${fileName}`);
      
      const profileUpload = uploadBytes(storageRef, formData.profileImage)
        .then(() => getDownloadURL(storageRef))
        .then(downloadURL => {
          newFormData.profileImageUrl = downloadURL;
          return true;
        })
        .catch(error => {
          console.error("Error uploading profile image:", error);
          toast.error("Failed to upload profile image");
          return false;
        });
        
      uploads.push(profileUpload);
    }
    
    const results = await Promise.all(uploads);
    
    setFileUploading({ logo: false, profile: false });
    
    if (results.includes(false)) {
      return null;
    }
    
    return newFormData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.province || !formData.district || !formData.institutionName) {
        toast.error('Please fill in all required organization details');
        setIsSubmitting(false);
        return;
      }
      const pd = formData.personalDetails;
      if (!pd.name || !pd.designation || !pd.email || !pd.contactNumber) {
        toast.error('Please fill in all required personal details');
        setIsSubmitting(false);
        return;
      }
      
      let updatedFormData = formData;
      if (formData.organizationLogo || formData.profileImage) {
        toast.info('Uploading images, please wait...', { autoClose: 3000 });
        updatedFormData = await uploadImagesToFirebase();
        
        if (!updatedFormData) {
          toast.error('Failed to upload images. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      const organizationData = {
        province: updatedFormData.province,
        district: updatedFormData.district,
        institutionName: updatedFormData.institutionName,
        websiteUrl: updatedFormData.websiteUrl,
        personalDetails: updatedFormData.personalDetails,
        organizationLogoUrl: updatedFormData.organizationLogoUrl,
        profileImageUrl: updatedFormData.profileImageUrl,
        services: [] // Empty services array
      };

      try {
        const response = await organizationService.createOrganization(organizationData);
        
        // Save the newly created organization for the "Add Services" button
        setNewlyCreatedOrg({
          id: response.data?.organization?.id,
          institution_name: response.data?.organization?.institution_name || organizationData.institutionName,
          province: response.data?.organization?.province || organizationData.province,
          district: response.data?.organization?.district || organizationData.district
        });
        
        if (response.firebasePdfUrl) {
          setFirebasePdfUrl(response.firebasePdfUrl);
          window.open(response.firebasePdfUrl, '_blank');
          toast.success('Registration submitted! Your PDF is opening now.', { autoClose: 5000 });
        } else if (response.firebaseDocxUrl) {
          setFirebaseDocxUrl(response.firebaseDocxUrl);
          toast.success('Registration submitted! Your DOCX file is available for download.', { autoClose: 5000 });
        } else if (response.pdfPath) {
          const fullPdfUrl = `${BACKEND_URL}${response.pdfPath}`;
          setPdfUrl(fullPdfUrl);
          window.open(fullPdfUrl, '_blank');
          toast.success('Registration submitted! Your PDF is opening now.', { autoClose: 5000 });
        } else if (response.docxPath) {
          const fullDocxUrl = `${BACKEND_URL}${response.docxPath}`;
          setDocxUrl(fullDocxUrl);
          toast.success('Registration submitted! Your DOCX file is available for download.', { autoClose: 5000 });
        }

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
        setImagePreview({
          organizationLogo: null,
          profileImage: null
        });
        
        // If a callback was provided, call it with the new organization
        if (onOrganizationCreated && response.data?.organization) {
          onOrganizationCreated(response.data.organization);
        }
        
      } catch (err) {
        console.error('API error:', err);
        
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
  
  const handleAddServices = () => {
    if (onOrganizationCreated && newlyCreatedOrg) {
      onOrganizationCreated(newlyCreatedOrg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto my-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg p-6 shadow-lg">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white ml-3">Organization Registration</h1>
        </div>
        <p className="text-blue-100">
          Complete this form to register your organization with our platform. Once submitted, you'll receive a PDF document with your registration details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-b-lg shadow-lg p-6 border-t-0">
        {/* Step 1: Organization Details */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="inline-flex items-center bg-blue-600 text-white px-4 py-1 rounded-full font-medium text-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Step 1: Organization Details
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-700 font-medium block mb-1">Province *</label>
              <select
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:border-blue-400"
              >
                <option value="">Select Province</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-700 font-medium block mb-1">District *</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                required
                disabled={!formData.province}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:border-blue-400 disabled:bg-gray-100"
              >
                <option value="">Select District</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-700 font-medium block mb-1">Institution Name *</label>
              <input
                type="text"
                name="institutionName"
                value={formData.institutionName}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:border-blue-400"
                placeholder="Enter your institution name"
              />
            </div>
            <div>
              <label className="text-gray-700 font-medium block mb-1">Website URL</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:border-blue-400"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Contact Information */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="inline-flex items-center bg-green-500 text-white px-4 py-1 rounded-full font-medium text-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Step 2: Contact Information
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-gray-700 font-medium block mb-1">Full Name *</label>
              <input
                type="text"
                name="personalDetails.name"
                value={formData.personalDetails.name}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:border-blue-400"
                placeholder="Your full name"
                pattern="[A-Za-z\s.]+"
                title="Please enter only letters, spaces, and dots"
                onKeyPress={(e) => {
                  if (!/[A-Za-z\s.]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </div>
            <div>
              <label className="text-gray-700 font-medium block mb-1">Designation *</label>
              <input
                type="text"
                name="personalDetails.designation"
                value={formData.personalDetails.designation}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:border-blue-400"
                placeholder="Your title or position"
              />
            </div>
            <div>
              <label className="text-gray-700 font-medium block mb-1">Email Address *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <input
                  type="email"
                  name="personalDetails.email"
                  value={formData.personalDetails.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 pl-9 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:border-blue-400"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-700 font-medium block mb-1">Contact Number *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  name="personalDetails.contactNumber"
                  value={formData.personalDetails.contactNumber}
                  onChange={handleInputChange}
                  required
                  pattern="[0-9]{10}"
                  maxLength="10"
                  className="w-full p-2 pl-9 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 focus:border-blue-400"
                  placeholder="Your phone number"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Branding & Images */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="inline-flex items-center bg-purple-600 text-white px-4 py-1 rounded-full font-medium text-sm mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            Step 3: Branding & Images
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <label className="block mb-2 text-gray-700 font-medium">Organization Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileChange(e, 'organizationLogo')}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
              />
              {fileUploading.logo && (
                <div className="mt-2 flex items-center text-blue-600">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
              {imagePreview.organizationLogo && (
                <div className="mt-2 flex items-center justify-center border rounded p-2 bg-white">
                  <img 
                    src={imagePreview.organizationLogo} 
                    alt="Organization Logo Preview" 
                    className="h-24 object-contain"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = 'https://via.placeholder.com/150?text=Logo+Preview';
                    }}
                  />
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <label className="block mb-2 text-gray-700 font-medium">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileChange(e, 'profileImage')}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-400"
              />
              {fileUploading.profile && (
                <div className="mt-2 flex items-center text-blue-600">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
              {imagePreview.profileImage && (
                <div className="mt-2 flex items-center justify-center border rounded p-2 bg-white">
                  <img 
                    src={imagePreview.profileImage} 
                    alt="Profile Image Preview" 
                    className="h-24 object-contain"
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

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting || fileUploading.logo || fileUploading.profile}
            className={`w-full py-3 rounded text-white font-bold shadow ${
              isSubmitting || fileUploading.logo || fileUploading.profile 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Registration...
              </div>
            ) : 'Submit Registration'}
          </button>
        </div>
      </form>

      {/* Document Links and Add Services Button */}
      {(firebasePdfUrl || firebaseDocxUrl || pdfUrl || docxUrl || newlyCreatedOrg) && (
        <div className="mt-6">
          {(firebasePdfUrl || firebaseDocxUrl || pdfUrl || docxUrl) && (
            <div className="p-4 mb-4 bg-blue-50 rounded border border-blue-200 shadow">
              <h3 className="font-medium text-lg text-blue-800 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Your Registration Documents
              </h3>
              
              <div className="space-y-2">
                {firebasePdfUrl && (
                  <a
                    href={firebasePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 bg-white rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                  >
                    <div className="bg-red-100 p-1 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-800">Registration PDF</h4>
                      <p className="text-xs text-gray-500">View or download your registration document</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                {firebaseDocxUrl && (
                  <a
                    href={firebaseDocxUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-2 bg-white rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                  >
                    <div className="bg-blue-100 p-1 rounded">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-gray-800">Registration DOCX</h4>
                      <p className="text-xs text-gray-500">Download your registration document</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          )}
          
          {newlyCreatedOrg && (
            <button
              type="button"
              onClick={handleAddServices}
              className="w-full py-3 rounded text-white font-bold shadow bg-green-600 hover:bg-green-700 flex justify-center items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Add Services to {newlyCreatedOrg.institution_name}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationForm;
