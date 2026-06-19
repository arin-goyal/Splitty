import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// NOTE: Physical devices cannot reach 'localhost' — it resolves to the device itself.
// Use your machine's LAN IP so both the PC and phone can connect to the backend.
const API_URL = 'https://splitty-production-d19a.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if token exists
api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept 401 errors to automatically log out
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Clear auth store
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
