import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // Action to log in after OTP success [cite: 2026-02-16]
      setAuth: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),

      // Action to update sustainability score [cite: 2026-02-13]
      updateSustainability: (points) => set((state) => ({
        user: { ...state.user, sustainabilityScore: state.user.sustainabilityScore + points }
      })),

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('auth-storage');
      },
    }),
    {
      name: 'auth-storage', // Saves to localStorage automatically
    }
  )
);

export default useAuthStore;