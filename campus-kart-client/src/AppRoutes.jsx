import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import App from './App'; // This is currently our Landing/Hero test [cite: 2026-02-16]

// Placeholder components for now
const Login = () => <div className="p-10 text-white">Login Page (Coming Next)</div>;
const Dashboard = () => <div className="p-10 text-white">Dashboard (Verified Only)</div>;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes [cite: 2026-02-13] */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default AppRoutes;