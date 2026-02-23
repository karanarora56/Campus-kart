import { Moon, Sun } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';

const Navbar = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center border-b border-white/5 bg-midnight-base/80 backdrop-blur-md transition-all">
      <div className="text-2xl font-bold tracking-tighter text-white">
        Campus <span className="text-midnight-accent">Kart</span>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun size={20} className="text-midnight-accent" />
          ) : (
            <Moon size={20} className="text-slate-400" />
          )}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;