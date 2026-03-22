import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'; 
import { Home, Search, MessageSquare, User, PackagePlus, LogOut, LogIn, ShieldAlert } from 'lucide-react'; 
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore'; 
import { ThemeToggle } from './ThemeToggle';

// --- CUSTOM BRAND LOGO ---
const BrandLogo = () => (
  <div className="flex items-center gap-3">
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric-violet text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h4l2.5 11.5c.1.5.8 1.5 2 1.5h8c1.2 0 1.9-1 2-1.5L22 7H6.5" />
        <circle cx="10" cy="20" r="2" />
        <circle cx="18" cy="20" r="2" />
        <path d="M13 4 10 9h4l-2 5" stroke="#FBBF24" fill="#FBBF24" /> 
      </svg>
    </div>
    {/* Scaled to 24px so it fits perfectly inside the new wider sidebar */}
    <span className="whitespace-nowrap text-[24px] font-black tracking-wide text-slate-900 dark:text-white">
      CAMPUS<span className="text-electric-violet">KART</span>
    </span>
  </div>
);

export const Layout = () => {
  const { logout } = useAuth(); 
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const currentUser = useStore((state) => state.user);
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
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-900 transition-colors duration-300 dark:bg-[#06080A] dark:text-white overflow-hidden">
      
      {/* --- DESKTOP SIDEBAR --- */}
      {/* FIX: Changed w-64 to w-72 to give the logo room to breathe! */}
      <aside className="hidden md:flex w-72 flex-col border-r border-slate-200 bg-[#F8FAFC] transition-colors duration-300 dark:border-white/5 dark:bg-[#06080A] p-6">
        <div className="mb-10 pt-2">
          <BrandLogo />
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <NavLink key={item.name} to={item.path}>
              {({ isActive }) => (
                <motion.div 
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors duration-200 ${
                    isActive 
                      ? 'bg-electric-violet text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-200 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-semibold">{item.name}</span>
                </motion.div>
              )}
            </NavLink>
          ))}

          {currentUser?.role === 'admin' && (
            <NavLink to="/admin" className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
              {({ isActive }) => (
                <motion.div 
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors duration-200 ${
                    isActive 
                      ? 'bg-red-500 text-white shadow-md' 
                      : 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                  }`}
                >
                  <ShieldAlert size={20} />
                  <span className="font-semibold">Admin Panel</span>
                </motion.div>
              )}
            </NavLink>
          )}
        </nav>

        <div className="mt-auto border-t border-slate-200 dark:border-white/5 pt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-sm font-semibold text-slate-500 dark:text-gray-400">Theme</span>
            <ThemeToggle />
          </div>

          {isAuthenticated ? (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout} 
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-slate-200 py-3.5 text-slate-700 transition-colors hover:bg-red-500 hover:text-white dark:bg-white/5 dark:text-gray-300 dark:hover:bg-red-500 dark:hover:text-white"
            >
              <LogOut size={18} />
              <span className="font-semibold">Log Out</span>
            </motion.button>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/login" className="flex w-full items-center justify-center gap-3 rounded-xl bg-electric-violet py-3.5 text-white shadow-lg transition-all hover:bg-[#6D28D9]">
                <LogIn size={18} />
                <span className="font-semibold">Sign In / Join</span>
              </Link>
            </motion.div>
          )}
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 scroll-smooth">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 md:hidden border-b border-slate-200 dark:border-white/5 bg-[#F8FAFC] dark:bg-[#06080A] sticky top-0 z-40">
          <BrandLogo />
          <ThemeToggle />
        </div>
        
        <div className="mx-auto h-full w-full max-w-6xl p-4 md:p-8 pt-6">
          <Outlet /> 
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-[72px] items-center justify-around border-t border-slate-200 bg-[#F8FAFC]/90 pb-safe transition-colors duration-300 dark:border-white/10 dark:bg-[#06080A]/90 px-2 backdrop-blur-xl">
        {navItems.map((item) => (
          <NavLink key={item.name} to={item.path} className={({ isActive }) =>
              `flex flex-col items-center justify-center transition-all duration-200 w-16 ${
                item.isPrimary 
                  ? 'absolute bottom-6 h-14 w-14 rounded-full bg-electric-violet text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)] border-4 border-[#F8FAFC] dark:border-[#06080A]' 
                  : isActive ? 'text-electric-violet' : 'text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white'
              }`
            }>
            <item.icon size={item.isPrimary ? 24 : 22} className={item.isPrimary ? '' : 'mb-1'} />
            {!item.isPrimary && <span className="text-[10px] font-semibold">{item.name.split(' ')[0]}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};