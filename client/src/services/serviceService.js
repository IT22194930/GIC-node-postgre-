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

const serviceService = {
  // Get services by the current user
  getUserServices: async () => {
    try {
      const response = await axiosInstance.get('/user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get services for a specific organization
  getOrganizationServices: async (organizationId) => {
    try {
      const response = await axiosInstance.get(`/organization/${organizationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get service by ID
  getServiceById: async (serviceId) => {
    try {
      const response = await axiosInstance.get(`/${serviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new service for an organization
  createService: async (organizationId, serviceData) => {
    try {
      const response = await axiosInstance.post(`/organization/${organizationId}`, serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a service
  updateService: async (serviceId, organizationId, serviceData) => {
    try {
      const response = await axiosInstance.put(`/${serviceId}/organization/${organizationId}`, serviceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a service
  deleteService: async (serviceId, organizationId) => {
    try {
      const response = await axiosInstance.delete(`/${serviceId}/organization/${organizationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get services submitted by the current user from services_for_review table
  getUserSubmittedServices: async () => {
    try {
      const response = await axiosInstance.get('/submissions/user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get services for review by status (admin only)
  getServicesByStatus: async (status) => {
    try {
      const response = await axiosInstance.get(`/pending-review?status=${status}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a service's review status (admin only)
  updatePendingServiceStatus: async (serviceId, status) => {
    try {
      const response = await axiosInstance.post(`/review/${serviceId}`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a service from services_for_review table
  deleteServiceSubmission: async (serviceId) => {
    try {
      const response = await axiosInstance.delete(`/submissions/${serviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Submit a service for approval (moves from services_for_review to services table)
  submitServiceForApproval: async (serviceId) => {
    try {
      const response = await axiosInstance.post(`/submissions/${serviceId}/submit`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all services with optional status filter
  getAllServices: async (status = null) => {
    try {
      const url = status ? `/all?status=${status}` : '/all';
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a service directly from services table (for admin use)
  deleteServiceDirect: async (serviceId) => {
    try {
      const response = await axiosInstance.delete(`/${serviceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update a service's status directly (admin only)
  updateServiceStatus: async (serviceId, newStatus) => {
    try {
      const response = await axiosInstance.patch(`/${serviceId}/status`, { status: newStatus });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default serviceService;