import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ClipboardList, Search, X, Loader, User, Calendar, Clock, Shield, CreditCard } from 'lucide-react';

interface StaffLog {
  id: string;
  admin_id: string;
  staff_name: string;
  admin_username: string;
  cashier_username: string;
  role: string;
  logged_in_at: string;
}

export function StaffLogs() {
  const [logs, setLogs] = useState<StaffLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchLogs();

    const subscription = supabase
      .channel('staff-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'staff_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_logs')
        .select('*')
        .order('logged_in_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching staff logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLogs = () => {
    let filtered = logs;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.staff_name.toLowerCase().includes(q) ||
          log.admin_username.toLowerCase().includes(q) ||
          log.cashier_username.toLowerCase().includes(q) ||
          log.role.toLowerCase().includes(q)
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((log) => {
        const logDate = new Date(log.logged_in_at);
        switch (dateFilter) {
          case 'today':
            return logDate >= startOfDay;
          case 'week': {
            const weekAgo = new Date(startOfDay);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return logDate >= weekAgo;
          }
          case 'month': {
            const monthAgo = new Date(startOfDay);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return logDate >= monthAgo;
          }
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredLogs = getFilteredLogs();

  const uniqueStaff = new Set(logs.map((l) => l.staff_name)).size;
  const todayCount = logs.filter((l) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return new Date(l.logged_in_at) >= startOfDay;
  }).length;
  const adminCount = logs.filter((l) => l.role === 'admin').length;
  const cashierCount = logs.filter((l) => l.role === 'cashier').length;

  const formatDateTime = (iso: string) => {
    const date = new Date(iso);
    return {
      date: date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Staff Logs</h2>
          <p className="text-gray-600 text-sm sm:text-base">Track who accessed the admin panel</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm">
          <ClipboardList className="w-4 h-4" />
          {logs.length} Total Entries
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-6 h-6 opacity-80" />
            <span className="text-sm font-medium opacity-80">Total Logins</span>
          </div>
          <p className="text-4xl font-bold">{logs.length}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 opacity-80" />
            <span className="text-sm font-medium opacity-80">Logins Today</span>
          </div>
          <p className="text-4xl font-bold">{todayCount}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 opacity-80" />
            <span className="text-sm font-medium opacity-80">Admin Logins</span>
          </div>
          <p className="text-4xl font-bold">{adminCount}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6 opacity-80" />
            <span className="text-sm font-medium opacity-80">Cashier Logins</span>
          </div>
          <p className="text-4xl font-bold">{cashierCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by staff name, username, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'today', 'week', 'month'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition text-sm capitalize ${
                  dateFilter === f
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Logs Found</h3>
          <p className="text-gray-500">
            {searchQuery || dateFilter !== 'all'
              ? 'No entries match your filters.'
              : 'Staff activity will be recorded here once someone logs in.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">#</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Staff Name</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Role</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Account</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const { date, time } = formatDateTime(log.logged_in_at);
                  const isCashier = log.role === 'cashier';
                  const accountName = isCashier ? log.cashier_username : log.admin_username;
                  return (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-4 px-6 text-sm text-gray-500 font-medium">
                        {filteredLogs.length - index}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                            isCashier
                              ? 'bg-gradient-to-br from-green-500 to-green-600'
                              : 'bg-gradient-to-br from-slate-600 to-slate-700'
                          }`}>
                            {log.staff_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-800">{log.staff_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isCashier
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isCashier ? 'Cashier' : 'Admin'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                          @{accountName}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {date}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {time}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} entries
          </div>
        </div>
      )}
    </div>
  );
}
