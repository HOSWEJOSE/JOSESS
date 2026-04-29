import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'customer' | 'cashier';
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, profile, initializing, loading } = useAuth();

  if (initializing || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-yellow-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    const loginPath = {
      admin: '/login/admin',
      cashier: '/login/cashier',
      customer: '/login/customer',
    };
    return <Navigate to={loginPath[requiredRole || 'customer']} replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    const redirectPath = {
      admin: '/admin',
      cashier: '/cashier',
      customer: '/customer',
    };
    return <Navigate to={redirectPath[profile.role as 'admin' | 'cashier' | 'customer']} replace />;
  }

  return <Outlet />;
}
