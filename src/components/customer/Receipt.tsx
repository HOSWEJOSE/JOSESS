import { useEffect, useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReceiptProps {
  orderNumber: string;
  onClose: () => void;
}

interface OrderDetails {
  id: string;
  order_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
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

export function Receipt({ orderNumber, onClose }: ReceiptProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();

    const subscription = supabase
      .channel(`order-${orderNumber}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `order_number=eq.${orderNumber}` }, () => {
        fetchOrderDetails();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles(full_name, email),
          order_items(
            quantity,
            price_at_time,
            subtotal,
            menu_items(name)
          )
        `)
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (error) throw error;
      setOrderDetails(data as unknown as OrderDetails);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8">
          <div className="text-center">Loading receipt...</div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return null;
  }

  return (
    <>
      <style>{`
        @media print {
          * {
            background: transparent !important;
            color: black !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .print-container {
            position: static !important;
            width: 100% !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            z-index: 1 !important;
          }

          .print-content {
            padding: 20px !important;
            max-width: 100% !important;
          }

          .print-hidden {
            display: none !important;
          }

          .receipt-item {
            page-break-inside: avoid;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 no-print print:static print:bg-transparent print:inset-auto print:p-0 print:flex-none">
        <div className="print-container bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print:rounded-none print:max-h-none">
          <div className="print-content space-y-6 px-4 sm:px-6 pb-6">
            <div className="flex items-center justify-end no-print pt-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center receipt-item">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 print:hidden" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h2>
              <p className="text-gray-600">Thank you for your order</p>
            </div>

            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl p-6 text-center print:bg-gradient-to-r print:from-gray-900 print:to-gray-800">
              <div className="text-sm opacity-90 mb-2">Order Number</div>
              <div className="text-3xl font-bold tracking-wider">{orderDetails.order_number}</div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 space-y-4 receipt-item">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer Name:</span>
                <span className="font-semibold text-gray-800">{orderDetails.profiles.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date & Time:</span>
                <span className="font-semibold text-gray-800">
                  {new Date(orderDetails.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order Status:</span>
                <span className={`font-semibold px-3 py-1 rounded-full text-xs ${
                  orderDetails.order_status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : orderDetails.order_status === 'ready'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                } print:bg-transparent print:text-black`}>
                  {orderDetails.order_status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold text-gray-800 uppercase">{orderDetails.payment_method}</span>
              </div>
            </div>

            <div className="receipt-item">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Order Items</h3>
              <div className="space-y-3">
                {orderDetails.order_items.map((item, index) => (
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

            <div className="bg-gray-50 rounded-xl p-6 print:bg-transparent receipt-item">
              <div className="flex justify-between items-center text-2xl font-bold">
                <span className="text-gray-800">Total Amount</span>
                <span className="text-red-600 print:text-black">₱{Number(orderDetails.total_amount).toFixed(2)}</span>
              </div>
            </div>

            {orderDetails.payment_method === 'counter' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center print:bg-transparent print:border-black receipt-item">
                <p className="text-yellow-800 print:text-black font-semibold">
                  Please present this receipt at the counter to complete your payment and receive your order.
                </p>
              </div>
            )}

            {(orderDetails.payment_method === 'gcash' || orderDetails.payment_method === 'maya') && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center print:bg-transparent print:border-black receipt-item">
                <p className="text-green-800 print:text-black font-semibold">
                  Your payment has been confirmed. Please present this receipt at the counter to receive your order.
                </p>
              </div>
            )}

            <div className="text-center border-t border-gray-200 pt-6 no-print">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">MR. CHANGE</h3>
              <p className="text-gray-600 text-sm">Thank you for choosing us!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
