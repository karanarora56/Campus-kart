import axios from 'axios';
import { useStore } from '../store/useStore';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
  withCredentials: true, 
});

axiosInstance.interceptors.response.use(
  (response) => response, 
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // 403 Forbidden - Admin Ban Detected
      if (status === 403) {
        console.error("🚨 Access Denied: Admin Ban Detected");
        useStore.getState().clearUser(); 
        // Navigation delegated to <ProtectedRoute />
      }

      // 401 Unauthorized - Session Expired
      if (status === 401) {
        console.warn("🔒 Unauthorized: Session expired or unverified");
        useStore.getState().clearUser();
        // Navigation delegated to <ProtectedRoute />
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;