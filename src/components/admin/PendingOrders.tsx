import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Clock, Eye, X, Loader } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

type Order = Database['public']['Tables']['orders']['Row'];

interface OrderWithDetails extends Order {
  profiles: {
    full_name: string;
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

export function PendingOrders() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchPendingOrders();

    const subscription = supabase
      .channel('pending-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchPendingOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles(full_name),
          order_items(
            quantity,
            price_at_time,
            subtotal,
            menu_items(name)
          )
        `)
        .in('order_status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as unknown as OrderWithDetails[]);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    setConfirming(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'completed',
          completed_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      await fetchPendingOrders();
      setSelectedOrder(null);
      showToast('success', 'Order marked as COMPLETE!');
    } catch (error) {
      console.error('Error confirming order:', error);
      showToast('error', 'Failed to confirm order');
    } finally {
      setConfirming(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: 'preparing' | 'ready') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;
      await fetchPendingOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'preparing':
        return 'bg-blue-100 text-blue-700';
      case 'ready':
        return 'bg-green-100 text-green-700';
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
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">Pending Orders</h2>
          <p className="text-gray-600 text-sm sm:text-base">Orders waiting to be fulfilled</p>
        </div>
        <div className="bg-yellow-100 text-yellow-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-lg sm:text-2xl">
          {orders.length} Orders
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Pending Orders</h3>
          <p className="text-gray-500">All orders have been completed!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{order.order_number}</h3>
                      <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <p><strong>Customer:</strong> {order.profiles.full_name}</p>
                      <p><strong>Payment Method:</strong> {order.payment_method.toUpperCase()}</p>
                      <p><strong>Order Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600">₱{Number(order.total_amount).toFixed(2)}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Order Items:</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="text-gray-700">
                          {item.menu_items.name} <span className="font-semibold">× {item.quantity}</span>
                        </span>
                        <span className="font-semibold text-gray-800">₱{Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-gray-200 transition font-semibold text-sm sm:text-base"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>

                  {order.order_status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="flex-1 bg-blue-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-blue-600 transition font-semibold text-sm sm:text-base"
                    >
                      Start Preparing
                    </button>
                  )}

                  {order.order_status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="flex-1 bg-green-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-green-600 transition font-semibold text-sm sm:text-base"
                    >
                      Mark as Ready
                    </button>
                  )}

                  {(order.order_status === 'ready' || order.payment_status === 'paid') && (
                    <button
                      onClick={() => handleConfirmOrder(order.id)}
                      disabled={confirming}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:from-green-700 hover:to-green-600 transition font-semibold disabled:opacity-50 text-sm sm:text-base"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-500 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-800 mb-2">{selectedOrder.order_number}</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(selectedOrder.order_status)}`}>
                      {selectedOrder.order_status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-semibold text-gray-800">{selectedOrder.profiles.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold text-gray-800 uppercase">{selectedOrder.payment_method}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{item.menu_items.name}</div>
                        <div className="text-sm text-gray-600">
                          ₱{Number(item.price_at_time).toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-bold text-gray-800">
                        ₱{Number(item.subtotal).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span className="text-gray-800">Total Amount</span>
                  <span className="text-red-600">₱{Number(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={() => handleConfirmOrder(selectedOrder.id)}
                disabled={confirming}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:from-green-700 hover:to-green-600 transition disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                {confirming ? 'Processing...' : 'Mark as COMPLETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
