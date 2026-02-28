import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

export const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const { verifyOtp, loading, error } = useAuth();
  
  // Grab the current user state to get their email and verification status
  const user = useStore((state) => state.user);
  const isEmailVerified = useStore((state) => state.isEmailVerified);

  // Security Guards:
  // 1. If they are already verified, push them into the app
  if (isEmailVerified) {
    return <Navigate to="/" replace />;
  }
  // 2. If there's no user object at all, they shouldn't be here. Kick to login.
  if (!user?.email) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return; // Basic validation
    
    try {
      await verifyOtp(user.email, otp);
      // Zustand updates -> App.jsx re-renders -> <ProtectedRoute> lets them in!
    } catch {
      // Error is caught by useAuth and displayed below
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-rich-black px-4 text-white sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-electric-violet/20 text-electric-violet mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-white">
            Verify Your NITJ Email
          </h2>
          <p className="mt-3 text-center text-sm text-gray-400">
            We sent a 6-digit code to <span className="font-semibold text-electric-violet">{user.email}</span>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
              <p className="text-center text-sm text-red-400">{error}</p>
            </div>
          )}
          
          <div className="space-y-5">
            <div className="relative flex justify-center">
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
                className="block w-full text-center tracking-[0.5em] text-2xl font-bold rounded-2xl border border-white/10 bg-black/40 py-4 px-4 text-white placeholder-gray-600 transition-colors focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet"
                placeholder="000000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-electric-violet py-4 px-4 text-sm font-bold tracking-wide text-white transition-all duration-300 hover:bg-[#6D28D9] hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] focus:outline-none disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Verify & Enter Campus <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};