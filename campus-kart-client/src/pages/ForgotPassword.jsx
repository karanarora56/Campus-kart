import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const { forgotPassword, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      setSuccess(true);
      // Pass the email to the next screen so they don't have to retype it
      setTimeout(() => navigate('/reset-password', { state: { email } }), 2000);
    } catch {
      // Handled by useAuth
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-rich-black px-4 text-white sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-electric-violet">
            Reset Password
          </h2>
          <p className="mt-3 text-center text-sm text-gray-400">
            Enter your NITJ email to receive a recovery OTP
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-center text-sm text-red-400">{error}</div>}
          {success && <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4 text-center text-sm text-green-400">Code sent! Redirecting...</div>}
          
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Mail className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-2xl border border-white/10 bg-black/40 py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:border-electric-violet focus:outline-none focus:ring-1 focus:ring-electric-violet"
              placeholder="Student Email address"
            />
          </div>

          <button type="submit" disabled={loading} className="group relative flex w-full justify-center rounded-2xl bg-electric-violet py-4 px-4 text-sm font-bold text-white transition-all hover:bg-[#6D28D9] focus:outline-none disabled:opacity-50">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Recovery Code'}
          </button>
        </form>
        
        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>
    </div>
  );
};