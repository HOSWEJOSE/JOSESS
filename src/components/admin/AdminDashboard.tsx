import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, ShoppingBag, Package } from 'lucide-react';

interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockItems: number;
  todaySales: number;
  todayOrders: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    todaySales: 0,
    todayOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase
        .from('orders')
        .select('*, profiles(full_name)');

      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*');

      if (orders) {
        const totalSales = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const pendingOrders = orders.filter(o => o.order_status === 'pending').length;

        const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
        const todaySales = todayOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);

        setStats({
          totalSales,
          totalOrders: orders.length,
          pendingOrders,
          lowStockItems: menuItems?.filter(item => item.stock < 10).length || 0,
          todaySales,
          todayOrders: todayOrders.length,
        });

        setRecentOrders(orders.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
        <p className="text-gray-600 text-sm sm:text-base">Overview of your restaurant's performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          icon={<span className="text-3xl font-bold">₱</span>}
          title="Total Sales"
          value={`₱${stats.totalSales.toFixed(2)}`}
          subtitle={`Today: ₱${stats.todaySales.toFixed(2)}`}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Total Orders"
          value={stats.totalOrders.toString()}
          subtitle={`Today: ${stats.todayOrders}`}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8" />}
          title="Pending Orders"
          value={stats.pendingOrders.toString()}
          subtitle="Needs attention"
          color="bg-gradient-to-br from-yellow-500 to-yellow-600"
        />
        <StatCard
          icon={<Package className="w-8 h-8" />}
          title="Low Stock Items"
          value={stats.lowStockItems.toString()}
          subtitle="Need restocking"
          color="bg-gradient-to-br from-red-500 to-red-600"
        />
      </div>

      <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Recent Orders</h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Order #</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Customer</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Amount</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Payment</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Status</th>
                  <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-gray-800">{order.order_number}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">{order.profiles?.full_name || 'N/A'}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-800 whitespace-nowrap">₱{Number(order.total_amount).toFixed(2)}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {order.payment_method.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                        order.order_status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.order_status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.order_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, color }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className={`${color} text-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-lg transform hover:scale-105 transition`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="text-2xl sm:text-3xl">
          {icon}
        </div>
      </div>
      <h3 className="text-xs sm:text-sm font-medium opacity-90 mb-1">{title}</h3>
      <p className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{value}</p>
      <p className="text-xs sm:text-sm opacity-80">{subtitle}</p>
    </div>
  );
}
