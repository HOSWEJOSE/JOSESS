import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ShoppingCart, Plus, Minus, Search, X, AlertCircle } from 'lucide-react';
import { Database } from '../../lib/database.types';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface CartItem extends MenuItem {
  quantity: number;
}

interface CustomerMenuProps {
  onCartUpdate: (items: CartItem[]) => void;
  cartItems: CartItem[];
}

export function CustomerMenu({ onCartUpdate, cartItems }: CustomerMenuProps) {
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([]);
  const [unavailableItems, setUnavailableItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showUnavailable, setShowUnavailable] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (error) throw error;

      const available = (data || []).filter(item => item.stock > 0);
      const unavailable = (data || []).filter(item => item.stock === 0);

      setAvailableItems(available);
      setUnavailableItems(unavailable);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cartItems.find((ci) => ci.id === item.id);
    if (existingItem) {
      const updatedCart = cartItems.map((ci) =>
        ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
      );
      onCartUpdate(updatedCart);
    } else {
      onCartUpdate([...cartItems, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: string, change: number) => {
    const updatedCart = cartItems
      .map((item) =>
        item.id === itemId ? { ...item, quantity: item.quantity + change } : item
      )
      .filter((item) => item.quantity > 0);
    onCartUpdate(updatedCart);
  };

  const getItemQuantity = (itemId: string) => {
    return cartItems.find((item) => item.id === itemId)?.quantity || 0;
  };

  const allItems = [...availableItems, ...unavailableItems];
  const categories = ['All', ...new Set(allItems.map((item) => item.category))];

  let filteredAvailableItems =
    selectedCategory === 'All'
      ? availableItems
      : availableItems.filter((item) => item.category === selectedCategory);

  let filteredUnavailableItems =
    selectedCategory === 'All'
      ? unavailableItems
      : unavailableItems.filter((item) => item.category === selectedCategory);

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredAvailableItems = filteredAvailableItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
    filteredUnavailableItems = filteredUnavailableItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="sticky top-0 z-10 bg-gradient-to-br from-red-50 via-yellow-50 to-red-50 pb-2 sm:pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-red-500 transition text-sm sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-full font-semibold whitespace-nowrap transition text-sm sm:text-base ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="space-y-6 sm:space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Available Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAvailableItems.map((item) => {
              const quantity = getItemQuantity(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition"
                >
                  <div className="h-40 sm:h-48 bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white text-4xl sm:text-6xl font-bold">{item.name[0]}</div>
                    )}
                  </div>
                  <div className="p-3 sm:p-5">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="text-xl sm:text-2xl font-bold text-red-600">
                        ₱{Number(item.price).toFixed(2)}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">Stock: {item.stock}</span>
                    </div>

                    {quantity > 0 ? (
                      <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg sm:rounded-xl p-1.5 sm:p-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                        >
                          <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <span className="text-lg sm:text-xl font-bold">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={quantity >= item.stock}
                          className="p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-red-700 hover:to-red-600 transition text-sm sm:text-base"
                      >
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAvailableItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-600 text-lg">
                {searchQuery ? 'No available items match your search.' : 'No available items in this category.'}
              </p>
            </div>
          )}
        </div>

        {filteredUnavailableItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Unavailable Items</h2>
                <span className="bg-red-100 text-red-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
                  {filteredUnavailableItems.length}
                </span>
              </div>
              <button
                onClick={() => setShowUnavailable(!showUnavailable)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm sm:text-base"
              >
                {showUnavailable ? 'Hide' : 'Show'}
              </button>
            </div>

            {showUnavailable && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredUnavailableItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl sm:rounded-2xl shadow-md overflow-hidden opacity-75"
                  >
                    <div className="h-40 sm:h-48 bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center relative">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover grayscale" />
                      ) : (
                        <div className="text-white text-4xl sm:text-6xl font-bold">{item.name[0]}</div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-bold text-base sm:text-xl">Out of Stock</span>
                      </div>
                    </div>
                    <div className="p-3 sm:p-5">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">{item.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className="text-xl sm:text-2xl font-bold text-gray-400">
                          ₱{Number(item.price).toFixed(2)}
                        </span>
                        <span className="text-xs sm:text-sm text-red-600 font-semibold">Out of Stock</span>
                      </div>
                      <button
                        disabled
                        className="w-full bg-gray-200 text-gray-500 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold cursor-not-allowed text-sm sm:text-base"
                      >
                        Unavailable
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
