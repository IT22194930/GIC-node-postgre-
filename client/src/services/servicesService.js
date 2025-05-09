import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/services`;

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

const servicesService = {
  // Get all services
  getAllServices: async () => {
    try {
      const response = await axiosInstance.get('/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get service by ID
  getServiceById: async (id) => {
    try {
      const response = await axiosInstance.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new service
  createService: async (serviceData) => {
    try {
      const response = await axiosInstance.post('/', serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update service
  updateService: async (id, serviceData) => {
    try {
      const response = await axiosInstance.put(`/${id}`, serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete service
  deleteService: async (id) => {
    try {
      const response = await axiosInstance.delete(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get services for an organization
  getServicesByOrganization: async (organizationId) => {
    try {
      const response = await axiosInstance.get(`/organization/${organizationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get services by category
  getServicesByCategory: async (category) => {
    try {
      const response = await axiosInstance.get(`/category/${category}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search services
  searchServices: async (query) => {
    try {
      const response = await axiosInstance.get(`/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default servicesService;