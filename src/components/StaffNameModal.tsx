import { useState } from 'react';
import { UserCheck, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface StaffNameModalProps {
  adminId: string;
  adminUsername: string;
  onConfirm: () => void;
}

export function StaffNameModal({ adminId, adminUsername, onConfirm }: StaffNameModalProps) {
  const [staffName, setStaffName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('staff_logs').insert({
        admin_id: adminId,
        staff_name: staffName.trim(),
        admin_username: adminUsername,
        cashier_username: '',
        role: 'admin',
      });

      if (error) throw error;

      showToast('success', `Welcome, ${staffName.trim()}!`);
      onConfirm();
    } catch (err) {
      console.error('Error saving staff log:', err);
      showToast('error', 'Failed to save staff log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Who's on duty?</h2>
          <p className="text-slate-300 text-sm">Please enter your name to continue to the admin panel</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Staff Name
              </label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                required
                autoFocus
                maxLength={80}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition text-gray-800 text-lg"
                placeholder="Enter your full name..."
              />
              <p className="text-xs text-gray-500 mt-1">This will be recorded in the staff activity log.</p>
            </div>

            <button
              type="submit"
              disabled={loading || !staffName.trim()}
              className="w-full bg-gradient-to-r from-slate-800 to-slate-700 text-white py-3 rounded-xl font-bold text-lg hover:from-slate-900 hover:to-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5" />
                  Enter Admin Panel
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
