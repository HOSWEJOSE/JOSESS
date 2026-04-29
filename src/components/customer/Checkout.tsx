import { useState } from 'react';
import { X, Store } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface CartItem extends MenuItem {
  quantity: number;
}

interface CheckoutProps {
  cartItems: CartItem[];
  onClose: () => void;
  onSuccess: (orderNumber: string) => void;
}

type PaymentMethod = 'counter';

export function Checkout({ cartItems, onClose, onSuccess }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const handleSubmitOrder = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: orderNumberData } = await supabase.rpc('generate_order_number' as any);
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      const orderItems = cartItems.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: Number(item.price),
      }));

      const { data: result, error: createError } = await supabase.rpc(
        'create_order_with_items',
        {
          p_customer_id: user.id,
          p_total_amount: total,
          p_payment_method: paymentMethod,
          p_payment_status: 'pending',
          p_order_number: orderNumber,
          p_order_items: orderItems,
        }
      );

      if (createError) throw createError;
      if (!result?.[0]?.success) {
        throw new Error(result?.[0]?.message || 'Failed to create order');
      }

      onSuccess(orderNumber);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethod = 'counter';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-500 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold">Checkout</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Order Summary</h3>
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-700">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-semibold text-gray-800">
                    ₱{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 sm:pt-3 flex justify-between">
                <span className="font-bold text-gray-800 text-sm sm:text-base">Total</span>
                <span className="font-bold text-red-600 text-lg sm:text-xl">₱{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Payment Method</h3>
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-red-600 bg-red-50">
              <div className="text-red-600">
                <Store className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold text-gray-800 text-sm sm:text-base">Pay at Counter</div>
                <div className="text-xs sm:text-sm text-gray-600">Pay when you pick up your order</div>
              </div>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-red-600 bg-red-600 flex items-center justify-center flex-shrink-0">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-yellow-800">
              <strong>Note:</strong> Please present this receipt at the counter to complete your payment and receive your order.
            </p>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:from-red-700 hover:to-red-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
