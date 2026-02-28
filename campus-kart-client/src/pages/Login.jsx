import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore';
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'; // ADDED ArrowLeft

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();
  
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const isEmailVerified = useStore((state) => state.isEmailVerified); 

  if (isAuthenticated) {
    return <Navigate to={isEmailVerified ? "/" : "/verify-otp"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch {
      // Error handled by useAuth
    }
  };

  return (
    // ADDED 'relative' to this wrapper div
    <div className="relative flex min-h-screen items-center justify-center bg-rich-black px-4 text-white sm:px-6 lg:px-8">
      
      {/* THE ESCAPE HATCH */}
      <Link 
        to="/explore" 
        className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Explore</span>
      </Link>

      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div>
          <h2 className="mt-2 text-center text-4xl font-extrabold tracking-tight text-electric-violet">
            Campus Kart
          </h2>
          <p className="mt-3 text-center text-sm text-gray-400">
            Sign in to your verified student account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-center text-sm text-red-400">{error}</p>
            </div>
          )}
          
          <div className="space-y-5">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-white placeholder-gray-500 transition-colors focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet"
                placeholder="Student Email address"
              />
            </div>
            
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-white placeholder-gray-500 transition-colors focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet"
                placeholder="Password"
              />
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-electric-violet hover:text-white transition-colors">
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-2xl bg-electric-violet py-4 px-4 text-sm font-bold tracking-wide text-white transition-all duration-300 hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] focus:outline-none disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-400">
          New to Campus Kart?{' '}
          <Link to="/register" className="font-semibold text-electric-violet transition-colors hover:text-white">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};