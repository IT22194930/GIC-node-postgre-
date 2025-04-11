import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/organizations`;

// Create axios instance with auth header
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const organizationService = {
  // Create new organization
  createOrganization: async (organizationData) => {
    try {
      const response = await axiosInstance.post('/', organizationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all organizations
  getAllOrganizations: async (status = null) => {
    try {
      const url = status ? `/?status=${status}` : '/';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get organization by ID
  getOrganizationById: async (id) => {
    try {
      const response = await axiosInstance.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update organization status
  updateOrganizationStatus: async (id, status) => {
    try {
      const response = await axiosInstance.patch(`/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default organizationService; 