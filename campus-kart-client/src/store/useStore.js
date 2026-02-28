import { create } from 'zustand';

export const useStore = create((set, get) => ({
  user: null, 
  isAuthenticated: false,
  isEmailVerified: false,
  isBanned: false,
  sustainabilityScore: 0,
  impactLevel: 'Seedling',

  setUser: (userData) => {
    const currentState = get();
    
    // FIXED: Only guard if we are already logged out and receive a null/empty payload.
    // This allows legitimate profile updates (where _id is the same but other data changes) to pass through.
    if (!currentState.isAuthenticated && !userData) {
        return; 
    }
    
    set({ 
      user: userData,
      isAuthenticated: !!userData,
      isEmailVerified: userData?.isEmailVerified || false,
      isBanned: userData?.isBanned || false,
      sustainabilityScore: userData?.sustainabilityScore || 0,
      impactLevel: userData?.impactLevel || 'Seedling'
    });
  },
  
  clearUser: () => {
    const currentState = get();
    // GUARD: Prevent re-render if already logged out
    if (!currentState.isAuthenticated) return;

    set({ 
      user: null, 
      isAuthenticated: false, 
      isEmailVerified: false, 
      isBanned: false,
      sustainabilityScore: 0,
      impactLevel: 'Seedling'
    });
  },

  theme: typeof window !== 'undefined' 
    ? localStorage.getItem('theme') || 'dark' 
    : 'dark',
  
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    
    // FIXED: Added SSR safety net for the setter as well
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    
    return { theme: newTheme };
  })
}));