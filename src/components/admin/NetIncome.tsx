import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Loader, Calendar, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface CashierIncome {
  cashierId: string;
  cashierName: string;
  cashierUsername: string;
  totalOrders: number;
  netIncome: number;
}

interface MonthOption {
  value: string;
  label: string;
}

export function NetIncome() {
  const [cashierIncomes, setCashierIncomes] = useState<CashierIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  useEffect(() => {
    generateMonthOptions();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchNetIncome();
    }
  }, [selectedMonth]);

  const generateMonthOptions = () => {
    const now = new Date();
    const options: MonthOption[] = [];

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }

    setMonths(options);
    setSelectedMonth(options[0].value);
    setCurrentMonthIndex(0);
  };

  const navigateMonth = (direction: -1 | 1) => {
    const newIndex = currentMonthIndex + direction;
    if (newIndex >= 0 && newIndex < months.length) {
      setCurrentMonthIndex(newIndex);
      setSelectedMonth(months[newIndex].value);
    }
  };

  const fetchNetIncome = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1).toISOString();
      const endOfMonth = new Date(year, month, 1).toISOString();

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, completed_by')
        .eq('order_status', 'completed')
        .gte('created_at', startOfMonth)
        .lt('created_at', endOfMonth)
        .not('completed_by', 'is', null);

      if (ordersError) throw ordersError;

      const uniqueIds = [...new Set(orders?.map((o) => o.completed_by) || [])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', uniqueIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const incomeMap = new Map<string, CashierIncome>();

      orders?.forEach((order) => {
        const cashierId = order.completed_by;
        const profile = profileMap.get(cashierId);
        const amount = Number(order.total_amount);

        if (!cashierId) return;

        const existing = incomeMap.get(cashierId);
        if (existing) {
          existing.totalOrders += 1;
          existing.netIncome += amount;
        } else {
          incomeMap.set(cashierId, {
            cashierId,
            cashierName: profile?.full_name || 'Unknown',
            cashierUsername: profile?.username || 'unknown',
            totalOrders: 1,
            netIncome: amount,
          });
        }
      });

      const sorted = Array.from(incomeMap.values()).sort((a, b) => b.netIncome - a.netIncome);
      setCashierIncomes(sorted);
    } catch (err) {
      console.error('Error fetching net income:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalNetIncome = cashierIncomes.reduce((sum, c) => sum + c.netIncome, 0);
  const totalOrders = cashierIncomes.reduce((sum, c) => sum + c.totalOrders, 0);
  const selectedLabel = months.find(m => m.value === selectedMonth)?.label || '';

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
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Net Income</h2>
          <p className="text-gray-600 text-sm sm:text-base">Monthly revenue per cashier — resets each month</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm">
          <span className="text-base font-bold">₱</span>
          {selectedLabel}
        </div>
      </div>

      {/* Month Navigator */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateMonth(1)}
            disabled={currentMonthIndex >= months.length - 1}
            className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-500" />
            <span className="text-lg font-bold text-gray-800">{selectedLabel}</span>
          </div>

          <button
            onClick={() => navigateMonth(-1)}
            disabled={currentMonthIndex <= 0}
            className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold opacity-80">₱</span>
            <span className="text-sm font-medium opacity-80">Total Net Income</span>
          </div>
          <p className="text-4xl font-bold">₱{totalNetIncome.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 opacity-80" />
            <span className="text-sm font-medium opacity-80">Total Orders</span>
          </div>
          <p className="text-4xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl shadow-lg p-5">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 opacity-80" />
            <span className="text-sm font-medium opacity-80">Active Cashiers</span>
          </div>
          <p className="text-4xl font-bold">{cashierIncomes.length}</p>
        </div>
      </div>

      {/* Cashier Breakdown */}
      {cashierIncomes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <span className="text-6xl font-bold text-gray-300 block mb-4">₱</span>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Income Data</h3>
          <p className="text-gray-500">No completed orders found for {selectedLabel}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cashierIncomes.map((cashier, index) => {
            const percentage = totalNetIncome > 0 ? (cashier.netIncome / totalNetIncome) * 100 : 0;
            return (
              <div
                key={cashier.cashierId}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                        index === 0
                          ? 'bg-gradient-to-br from-amber-400 to-amber-500'
                          : index === 1
                          ? 'bg-gradient-to-br from-slate-400 to-slate-500'
                          : index === 2
                          ? 'bg-gradient-to-br from-orange-400 to-orange-500'
                          : 'bg-gradient-to-br from-slate-500 to-slate-600'
                      }`}>
                        {index === 0 ? '1' : index === 1 ? '2' : index === 2 ? '3' : String(index + 1)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{cashier.cashierName}</h3>
                        <p className="text-sm text-gray-500">@{cashier.cashierUsername}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-3xl font-bold text-emerald-600">₱{cashier.netIncome.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{cashier.totalOrders} order{cashier.totalOrders !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">{percentage.toFixed(1)}% of total</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
