import { useState, useEffect } from 'react';
import { UserPlus, Eye, EyeOff, Loader, Trash2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface Cashier {
  id: string;
  full_name: string;
  username: string;
  created_at: string;
}

export function CashierAccount() {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingCashier, setCreatingCashier] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, created_at')
        .eq('role', 'cashier')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCashiers((data || []) as Cashier[]);
    } catch (error) {
      console.error('Error fetching cashiers:', error);
      showToast('error', 'Failed to fetch cashiers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCashier(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('error', 'You must be logged in');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-cashier`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create cashier');
      }

      showToast('success', 'Cashier account created successfully!');
      setFormData({ fullName: '', username: '', password: '' });
      setShowForm(false);
      await fetchCashiers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create cashier';
      showToast('error', message);
    } finally {
      setCreatingCashier(false);
    }
  };

  const handleDeleteCashier = async (cashierId: string) => {
    if (!confirm('Are you sure you want to delete this cashier account?')) return;

    setDeletingId(cashierId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('error', 'You must be logged in');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-cashier`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cashierId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete cashier');
      }

      showToast('success', 'Cashier account deleted successfully!');
      await fetchCashiers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete cashier';
      showToast('error', message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Cashier Accounts</h2>
          <p className="text-gray-600 text-sm sm:text-base">Create and manage cashier login credentials</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-green-700 hover:to-green-600 transition font-semibold"
        >
          <UserPlus className="w-5 h-5" />
          <span className="hidden sm:inline">Create Cashier</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">New Cashier Account</h3>
          <form onSubmit={handleCreateCashier} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                placeholder="e.g., John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                placeholder="e.g., johndoe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creatingCashier}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 rounded-lg hover:from-green-700 hover:to-green-600 transition font-semibold disabled:opacity-50"
              >
                {creatingCashier ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : cashiers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Cashier Accounts</h3>
          <p className="text-gray-500">Create a cashier account to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {cashiers.map((cashier) => (
            <div key={cashier.id} className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">{cashier.full_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Username: <span className="font-semibold">{cashier.username}</span></p>
                  <p className="text-xs text-gray-500 mt-2">Created {new Date(cashier.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleDeleteCashier(cashier.id)}
                  disabled={deletingId === cashier.id}
                  className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition font-semibold text-sm disabled:opacity-50"
                >
                  {deletingId === cashier.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
