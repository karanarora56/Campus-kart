import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '../store/useStore';

export const ProtectedRoute = () => {
  // Grab only the specific flags we need to avoid unnecessary re-renders
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const isEmailVerified = useStore((state) => state.isEmailVerified);
  const isBanned = useStore((state) => state.isBanned);

  // 1. Not logged in at all -> Kick to Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Banned by Admin -> Kick to Access Denied (Catches them before UI loads)
  if (isBanned) {
    return <Navigate to="/access-denied" replace />;
  }

  // 3. Logged in, but hasn't completed Step 3.5 OTP Verification
  if (!isEmailVerified) {
    return <Navigate to="/verify-otp" replace />;
  }

  // 4. All checks passed -> Render the requested protected page
  return <Outlet />;
};