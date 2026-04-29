import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCart, LogOut, Receipt as ReceiptIcon, History } from 'lucide-react';
import { CustomerMenu } from './CustomerMenu';
import { Cart } from './Cart';
import { Checkout } from './Checkout';
import { Receipt } from './Receipt';
import { OrderHistory } from './OrderHistory';
import { Database } from '../../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface CartItem extends MenuItem {
  quantity: number;
}

export function CustomerLayout() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
  const menuRefreshKey = useRef(0);
  const [, setMenuRefresh] = useState(0);
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const handleCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleOrderSuccess = (orderNum: string) => {
    setOrderNumber(orderNum);
    setShowCheckout(false);
    setCartItems([]);
    menuRefreshKey.current += 1;
    setMenuRefresh(menuRefreshKey.current);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-red-50">
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center gap-1 sm:gap-3">
              <img src="/180fdd1f-21ad-41df-89f8-a837bb6c7940-Photoroom.png" alt="MR. CHANGE" className="h-8 sm:h-12 md:h-14" />
              <div>
                <h1 className="text-lg sm:text-2xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                  MR. CHANGE
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Delicious food, delivered fast</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden md:inline">Hello, {profile?.full_name || 'Guest'}!</span>
              <button
                onClick={() => setShowCart(true)}
                className="relative flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-2 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-full font-semibold hover:from-red-700 hover:to-red-600 transition shadow-lg text-sm sm:text-base"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-400 text-red-900 w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 sm:gap-2 px-2 py-2 sm:px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm sm:text-base">Sign Out</span>
              </button>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-3 sm:px-6 py-2 sm:py-3 font-semibold transition border-b-2 flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'menu'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden xs:inline">Menu</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 sm:px-6 py-2 sm:py-3 font-semibold transition border-b-2 flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'orders'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden xs:inline">My Orders</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {activeTab === 'menu' && (
          <>
            <div className="mb-4 sm:mb-8 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Our Menu</h2>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg">Choose your favorite items and enjoy!</p>
            </div>

            <CustomerMenu key={menuRefreshKey.current} onCartUpdate={setCartItems} cartItems={cartItems} />
          </>
        )}

        {activeTab === 'orders' && (
          <OrderHistory onViewReceipt={setOrderNumber} />
        )}
      </main>

      {showCart && (
        <Cart
          cartItems={cartItems}
          onClose={() => setShowCart(false)}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
        />
      )}

      {showCheckout && (
        <Checkout
          cartItems={cartItems}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {orderNumber && (
        <Receipt
          orderNumber={orderNumber}
          onClose={() => setOrderNumber(null)}
        />
      )}

      <footer className="bg-white mt-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-2">
            MR. CHANGE
          </h3>
          <p className="text-gray-600 text-sm">Serving happiness, one meal at a time</p>
          <p className="text-gray-500 text-xs mt-4">© 2026 MR. CHANGE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
