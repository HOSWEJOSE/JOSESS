import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PendingOrders } from '../components/admin/PendingOrders';
import { CompleteOrders } from '../components/admin/CompleteOrders';

export function CashierPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login/cashier');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <img src="/180fdd1f-21ad-41df-89f8-a837bb6c7940-Photoroom.png" alt="MR. CHANGE" className="w-12 h-12 sm:w-14 sm:h-14" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">MR. CHANGE</h1>
                <p className="text-xs sm:text-sm text-gray-600">Cashier Panel</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-700">{profile?.full_name}</p>
                <p className="text-xs text-gray-500">Cashier</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-red-700 transition font-semibold text-sm sm:text-base"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition ${
              activeTab === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Pending Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition ${
              activeTab === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Completed Orders</span>
          </button>
        </div>

        {activeTab === 'pending' && <PendingOrders />}
        {activeTab === 'completed' && <CompleteOrders />}
      </main>
    </div>
  );
}
