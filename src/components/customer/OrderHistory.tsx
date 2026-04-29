import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Loader } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

interface OrderDetails extends Order {
  profiles: {
    full_name: string;
    email: string;
  };
  order_items: Array<{
    quantity: number;
    price_at_time: number;
    subtotal: number;
    menu_items: {
      name: string;
    };
  }>;
}

interface OrderHistoryProps {
  onViewReceipt: (orderNumber: string) => void;
}

export function OrderHistory({ onViewReceipt }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();

    const subscription = supabase
      .channel('customer-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'preparing':
      case 'ready':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Yet</h3>
        <p className="text-gray-500">Your order history will appear here once you place an order.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">My Order History</h2>
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Order Number</p>
              <p className="font-bold text-gray-800 text-base sm:text-lg">{order.order_number}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Date</p>
              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
              <p className="font-bold text-red-600 text-base sm:text-lg">₱{Number(order.total_amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Status</p>
              <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.order_status)}`}>
                {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
              </span>
            </div>
            <button
              onClick={() => onViewReceipt(order.order_number)}
              className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm sm:text-base"
            >
              View
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
