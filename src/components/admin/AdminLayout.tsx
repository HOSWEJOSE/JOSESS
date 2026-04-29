import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Menu, Package, LogOut, Menu as MenuIcon, X, ClipboardList, Users, DollarSign } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { MenuManagement } from './MenuManagement';
import { StockManagement } from './StockManagement';
import { CashierAccount } from './CashierAccount';
import { StaffLogs } from './StaffLogs';
import { NetIncome } from './NetIncome';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getActiveTab = () => {
    if (location.pathname.includes('/admin/menu')) return 'menu';
    if (location.pathname.includes('/admin/stock')) return 'stock';
    if (location.pathname.includes('/admin/cashier-account')) return 'cashier-account';
    if (location.pathname.includes('/admin/staff-logs')) return 'staff-logs';
    if (location.pathname.includes('/admin/net-income')) return 'net-income';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login/admin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navBtn = (tab: string, path: string, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => {
        navigate(path);
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
        activeTab === tab
          ? 'bg-gradient-to-r from-red-600 to-red-500 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
              >
                <MenuIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <img src="/180fdd1f-21ad-41df-89f8-a837bb6c7940-Photoroom.png" alt="MR. CHANGE" className="h-8 sm:h-10 md:h-12" />
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">MR. CHANGE</h1>
                <p className="text-xs sm:text-sm opacity-90 hidden sm:block">Admin Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm hidden md:inline">Welcome, {profile?.full_name || 'Admin'}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 sm:gap-2 bg-white bg-opacity-20 px-2 py-2 sm:px-4 rounded-lg hover:bg-opacity-30 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm sm:text-base">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-4 sm:gap-6">
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-64 bg-white rounded-none lg:rounded-xl shadow-md p-4 h-screen lg:h-fit lg:sticky lg:top-6
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="flex items-center justify-between mb-4 lg:hidden border-b border-gray-200 pb-4">
              <h2 className="text-lg font-bold text-gray-800">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-2">
              {navBtn('dashboard', '/admin', <LayoutDashboard className="w-5 h-5" />, 'Dashboard')}
              {navBtn('menu', '/admin/menu', <Menu className="w-5 h-5" />, 'Menu Management')}
              {navBtn('stock', '/admin/stock', <Package className="w-5 h-5" />, 'Stock Management')}

              <div className="border-t border-gray-200 my-2 pt-2 space-y-2">
                {navBtn('cashier-account', '/admin/cashier-account', <Users className="w-5 h-5" />, 'Cashier Account')}
              </div>

              <div className="border-t border-gray-200 my-2 pt-2 space-y-2">
                {navBtn('net-income', '/admin/net-income', <DollarSign className="w-5 h-5" />, 'Net Income')}
                {navBtn('staff-logs', '/admin/staff-logs', <ClipboardList className="w-5 h-5" />, 'Staff Logs')}
              </div>
            </nav>
          </aside>

          <main className="flex-1">
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'menu' && <MenuManagement />}
            {activeTab === 'stock' && <StockManagement />}
            {activeTab === 'cashier-account' && <CashierAccount />}
            {activeTab === 'net-income' && <NetIncome />}
            {activeTab === 'staff-logs' && <StaffLogs />}
          </main>
        </div>
      </div>
    </div>
  );
}
