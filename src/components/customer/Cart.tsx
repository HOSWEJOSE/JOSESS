import { useState } from 'react';
import { X, ShoppingCart, Trash2 } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { ConfirmDialog } from '../ConfirmDialog';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface CartItem extends MenuItem {
  quantity: number;
}

interface CartProps {
  cartItems: CartItem[];
  onClose: () => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export function Cart({ cartItems, onClose, onRemoveItem, onCheckout }: CartProps) {
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const handleRemoveClick = (item: CartItem) => {
    setItemToRemove(item);
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      onRemoveItem(itemToRemove.id);
      setItemToRemove(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full sm:max-w-md h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-500 text-white p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-xl sm:text-2xl font-bold">Your Cart</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          <p className="text-xs sm:text-sm opacity-90">{cartItems.length} items in your cart</p>
        </div>

        <div className="p-4 sm:p-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-base sm:text-lg">Your cart is empty</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">Add some delicious items to get started!</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 sm:gap-4 bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-gray-100 transition"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex-shrink-0 overflow-hidden bg-gray-200">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center text-white font-bold text-xl sm:text-2xl">
                          {item.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base truncate">{item.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                        ₱{Number(item.price).toFixed(2)} × {item.quantity}
                      </p>
                      <p className="text-base sm:text-lg font-bold text-red-600">
                        ₱{(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveClick(item)}
                      className="p-1.5 sm:p-2 h-fit text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                <div className="flex justify-between text-base sm:text-lg">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold text-gray-800">₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl sm:text-2xl font-bold">
                  <span className="text-gray-800">Total</span>
                  <span className="text-red-600">₱{subtotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:from-red-700 hover:to-red-600 transition shadow-lg"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!itemToRemove}
        title="Remove Item from Cart"
        message={`Are you sure you want to remove "${itemToRemove?.name}" from your cart?`}
        confirmText="Yes, Remove"
        cancelText="Cancel"
        onConfirm={confirmRemove}
        onCancel={() => setItemToRemove(null)}
        type="danger"
      />
    </div>
  );
}
