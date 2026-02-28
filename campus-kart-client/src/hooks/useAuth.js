import { useState, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useStore } from '../store/useStore';

export const useAuth = () => {
  const setUser = useStore((state) => state.setUser);
  const clearUser = useStore((state) => state.clearUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/auth/profile');
      const userPayload = data.user || data.data?.user || data;
      setUser(userPayload);
    } catch { 
      clearUser();
    } finally {
      setLoading(false);
    }
  }, [setUser, clearUser]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      
      const userPayload = data.user || data.data?.user || data;
      // Triggers Login.jsx -> ProtectedRoute -> VerifyOTP (if unverified) or Explore
      setUser(userPayload); 
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.post('/auth/register', userData);
      
      // PERMANENT STATE FIX:
      // We explicitly construct the pending user state here.
      // This feeds Zustand immediately and triggers your ProtectedRoute pipeline
      // without relying on checkAuth() which would fail without a cookie.
      const pendingUser = {
        email: userData.email,
        isEmailVerified: false,
        ...(data.user || data.data?.user || {})
      };
      
      setUser(pendingUser);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.post('/auth/verify-otp', { email, otp });
      const userPayload = data.user || data.data?.user || data;
      setUser(userPayload); 
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.post('/auth/forgot-password', { email });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axiosInstance.post('/auth/reset-password', { email, otp, newPassword });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/auth/logout'); 
    } catch (err) {
      console.error("Server logout failed, clearing local state anyway", err);
    } finally {
      clearUser(); 
      setLoading(false);
    }
  };

  return { loading, error, checkAuth, login, register, verifyOtp, forgotPassword, resetPassword, logout };
};