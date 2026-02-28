import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'; 
import { Home, Search, MessageSquare, User, PackagePlus, LogOut, LogIn } from 'lucide-react'; 
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore'; 
import { ThemeToggle } from './ThemeToggle'; // 1. IMPORT TOGGLE

export const Layout = () => {
  const { logout } = useAuth(); 
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const handleLogout = async () => {
    navigate('/explore'); 
    await logout();       
  };

  const navItems = [
    { name: 'Explore', path: '/explore', icon: Search },
    { name: 'Found Feed', path: '/found', icon: Home },
    { name: 'Sell/Post', path: '/post', icon: PackagePlus, isPrimary: true },
    { name: 'Messages', path: '/chat', icon: MessageSquare },
    { name: 'Profile', path: '/dashboard', icon: User },
  ];

  return (
    // 2. DYNAMIC BACKGROUND: Paper/Snow for light mode, Rich Black for dark mode
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-900 transition-colors duration-300 dark:bg-rich-black dark:text-white overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR --- */}
      {/* Dynamic borders and background */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-[#F8FAFC] transition-colors duration-300 dark:border-white/10 dark:bg-rich-black p-6">
        <div className="mb-10 text-2xl font-bold tracking-widest text-electric-violet">
          CAMPUS KART
        </div>
        
        <nav className="flex flex-col gap-4 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 ${
                  isActive 
                    ? 'bg-electric-violet/10 text-electric-violet font-semibold' 
                    : 'text-slate-500 hover:bg-slate-200 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* BOTTOM SECTION */}
        <div className="mt-auto border-t border-slate-200 dark:border-white/10 pt-6 flex flex-col gap-6">
          
          {/* 3. PLACE THE THEME TOGGLE HERE */}
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-medium text-slate-500 dark:text-gray-400">Theme</span>
            <ThemeToggle />
          </div>

          {/* SMART AUTH BUTTON */}
          {isAuthenticated ? (
            <button 
              onClick={handleLogout} 
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-red-500 transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            >
              <LogOut size={20} />
              <span className="font-semibold">Log Out</span>
            </button>
          ) : (
            <Link 
              to="/login"
              className="flex w-full items-center gap-4 rounded-xl bg-electric-violet/10 px-4 py-3 text-electric-violet transition-all duration-200 hover:bg-electric-violet/20 hover:text-electric-violet"
            >
              <LogIn size={20} />
              <span className="font-semibold">Sign In / Join</span>
            </Link>
          )}
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="mx-auto h-full w-full max-w-5xl p-4 md:p-8">
          <Outlet /> 
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-[#F8FAFC]/90 transition-colors duration-300 dark:border-white/10 dark:bg-rich-black/90 px-2 backdrop-blur-md">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex h-12 w-12 flex-col items-center justify-center rounded-full transition-all duration-200 ${
                item.isPrimary 
                  ? '-translate-y-4 bg-electric-violet text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)]' 
                  : isActive
                    ? 'text-electric-violet'
                    : 'text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <item.icon size={item.isPrimary ? 24 : 20} />
          </NavLink>
        ))}
      </nav>

    </div>
  );
};