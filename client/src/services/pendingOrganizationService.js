import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/pending-organizations`;

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

const pendingOrganizationService = {
  // Create new pending organization
  createPendingOrganization: async (organizationData) => {
    try {
      const response = await axiosInstance.post('/', organizationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all pending organizations
  getAllPendingOrganizations: async (status = null) => {
    try {
      const url = status ? `/?status=${status}` : '/';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get pending organizations by user
  getUserPendingOrganizations: async () => {
    try {
      const response = await axiosInstance.get('/user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get pending organization by ID
  getPendingOrganizationById: async (id) => {
    try {
      const response = await axiosInstance.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update pending organization status
  updatePendingOrganizationStatus: async (id, status, action = null) => {
    try {
      const data = action ? { status, action } : { status };
      const response = await axiosInstance.patch(`/${id}/status`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Move from pending to approved organization
  approvePendingOrganization: async (id) => {
    try {
      const response = await axiosInstance.patch(`/${id}/status`, { 
        status: 'approved', 
        action: 'move' 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update pending organization details
  updatePendingOrganization: async (id, organizationData) => {
    try {
      const response = await axiosInstance.put(`/${id}`, organizationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete pending organization
  deletePendingOrganization: async (id) => {
    try {
      const response = await axiosInstance.delete(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default pendingOrganizationService;