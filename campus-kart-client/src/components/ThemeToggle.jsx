import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ThemeToggle = () => {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex h-10 w-20 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ${
        isDark ? 'bg-white/10' : 'bg-black/10'
      }`}
      aria-label="Toggle Theme"
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className={`flex h-8 w-8 items-center justify-center rounded-full shadow-md ${
          isDark ? 'bg-electric-violet text-white' : 'bg-white text-electric-violet'
        }`}
        style={{
          marginLeft: isDark ? 'auto' : '0',
        }}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? 360 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {isDark ? (
            <Moon size={16} className="fill-current" />
          ) : (
            <Sun size={16} className="fill-current" />
          )}
        </motion.div>
      </motion.div>
    </button>
  );
};