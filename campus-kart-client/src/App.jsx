import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login'; 
import { Register } from './pages/Register';
import { VerifyOTP } from './pages/VerifyOTP';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { useStore } from './store/useStore';
import { Explore } from './pages/Explore';
import { PostItem } from './pages/PostItem';
import { ProductDetail } from './pages/ProductDetail';
import { Chat } from './pages/Chat';
import { Dashboard } from './pages/Dashboard';
import { Found } from './pages/Found';
import { AdminDashboard } from './pages/AdminDashboard';

const AccessDenied = () => <div className="p-8 text-red-500 font-bold">Access Denied: Banned</div>;

function App() {
  // 1. CALL ALL HOOKS AT THE VERY TOP
  const { checkAuth, loading } = useAuth();
  const theme = useStore((state) => state.theme);

  // 2. RUN EFFECTS
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // 3. CONDITIONAL RETURNS (Must be after hooks!)
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-rich-black text-electric-violet font-bold tracking-widest">
        LOADING CAMPUS KART...
      </div>
    );
  }

  // 4. MAIN RENDER
  return (
    <BrowserRouter>
      <Routes>
        {/* --- COMPLETELY PUBLIC ROUTES --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        
        {/* --- SEMI-PROTECTED ROUTES --- */}
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* --- THE MAIN APP SHELL --- */}
        <Route element={<Layout />}>
          
          {/* 1. PUBLIC APP ROUTES (Anyone can window shop) */}
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* 2. STRICTLY PROTECTED APP ROUTES (Requires Login & OTP) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/found" element={<Found />} />
            <Route path="/post" element={<PostItem />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

        </Route>

        {/* --- 404 FALLBACK --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;