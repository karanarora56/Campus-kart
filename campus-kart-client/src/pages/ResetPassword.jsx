import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';

export const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Auto-fill email if they came directly from the ForgotPassword screen
 const [email] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const { resetPassword, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(email, otp, newPassword);
      navigate('/login', { replace: true });
    } catch {
      // Handled by useAuth
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-rich-black px-4 text-white sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-electric-violet">Create New Password</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-center text-sm text-red-400">{error}</div>}
          
          <div className="space-y-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><ShieldCheck className="h-5 w-5 text-gray-500" /></div>
              <input
                type="text" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="block w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet"
                placeholder="6-Digit OTP"
              />
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"><Lock className="h-5 w-5 text-gray-500" /></div>
              <input
                type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet"
                placeholder="New Password"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full justify-center rounded-2xl bg-electric-violet py-4 px-4 text-sm font-bold text-white transition-all hover:bg-[#6D28D9] focus:outline-none disabled:opacity-50 flex">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Password'}
          </button>
        </form>
      </div>
    </div>
  );
};