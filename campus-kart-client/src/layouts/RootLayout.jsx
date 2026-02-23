import React, { useEffect } from 'react';
import useThemeStore from '../store/useThemeStore';
import Navbar from '../components/shared/Navbar';

const RootLayout = ({ children }) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* Ensure main takes full height to show the background */}
      <main className="flex-1 pt-20">
        {children}
      </main>
    </div>
  );
};

export default RootLayout;