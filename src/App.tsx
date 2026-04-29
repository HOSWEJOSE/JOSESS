import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { CustomerSignIn } from './components/CustomerSignIn';
import { AdminSignIn } from './components/AdminSignIn';
import { CashierSignIn } from './components/CashierSignIn';
import { CustomerSignUp } from './components/CustomerSignUp';
import { AdminSignUp } from './components/AdminSignUp';
import { AdminPage } from './pages/AdminPage';
import { CustomerPage } from './pages/CustomerPage';
import { CashierPage } from './pages/CashierPage';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PaymentCancel } from './pages/PaymentCancel';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute } from './routes/ProtectedRoute';

function App() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-yellow-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login/customer" element={<CustomerSignIn />} />
      <Route path="/login/admin" element={<AdminSignIn />} />
      <Route path="/login/cashier" element={<CashierSignIn />} />
      <Route path="/signup/customer" element={<CustomerSignUp />} />
      <Route path="/signup/admin" element={<AdminSignUp />} />

      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/menu" element={<AdminPage />} />
        <Route path="/admin/stock" element={<AdminPage />} />
        <Route path="/admin/net-income" element={<AdminPage />} />
        <Route path="/admin/staff-logs" element={<AdminPage />} />
        <Route path="/admin/cashier-account" element={<AdminPage />} />
      </Route>

      <Route element={<ProtectedRoute requiredRole="cashier" />}>
        <Route path="/cashier" element={<CashierPage />} />
      </Route>

      <Route element={<ProtectedRoute requiredRole="customer" />}>
        <Route path="/customer" element={<CustomerPage />} />
      </Route>

      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-cancel" element={<PaymentCancel />} />

      <Route
        path="/"
        element={
          user ? (
            user.user_metadata?.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : user.user_metadata?.role === 'cashier' ? (
              <Navigate to="/cashier" replace />
            ) : (
              <Navigate to="/customer" replace />
            )
          ) : (
            <Navigate to="/login/customer" replace />
          )
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
