import axios from 'axios';

const API_URL = 'http://localhost:3000/api/users';

// Add auth token to requests
const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getAllUsers = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch users' };
  }
};

const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/${userId}`, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user details' };
  }
};

const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/${userId}`, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete user' };
  }
};

const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`${API_URL}/${userId}`, userData, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update user' };
  }
};

const updateProfile = async (userData) => {
  try {
    const response = await axios.put(`${API_URL}/me`, userData, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update profile' };
  }
};

export const userService = {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  updateProfile
}; 