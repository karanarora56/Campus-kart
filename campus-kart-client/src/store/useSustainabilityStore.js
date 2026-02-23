import { create } from 'zustand';

const useSustainabilityStore = create((set) => ({
  globalImpact: 0, // Total items re-homed in NITJ
  
  setGlobalImpact: (count) => set({ globalImpact: count }),
  
  addImpact: () => set((state) => ({ globalImpact: state.globalImpact + 1 })),
}));

export default useSustainabilityStore;