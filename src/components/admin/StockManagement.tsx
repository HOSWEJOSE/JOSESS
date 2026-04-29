import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Plus, Minus } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { useToast } from '../../contexts/ToastContext';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export function StockManagement() {
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('stock', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id: string, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ stock: newStock })
        .eq('id', id);

      if (error) throw error;
      await fetchMenuItems();
      showToast('success', 'Stock updated');
    } catch (error) {
      console.error('Error updating stock:', error);
      showToast('error', 'Error updating stock');
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: '🔴' };
    if (stock < 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700', icon: '⚠️' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700', icon: '✓' };
  };

  const filteredItems = menuItems.filter((item) => {
    if (filter === 'low') return item.stock > 0 && item.stock < 10;
    if (filter === 'out') return item.stock === 0;
    return true;
  });

  const stats = {
    total: menuItems.length,
    inStock: menuItems.filter(i => i.stock >= 10).length,
    lowStock: menuItems.filter(i => i.stock > 0 && i.stock < 10).length,
    outOfStock: menuItems.filter(i => i.stock === 0).length,
  };

  if (loading) {
    return <div className="text-center py-8">Loading stock information...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Stock Management</h2>
        <p className="text-gray-600">Monitor and manage inventory levels</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">Total Items</div>
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md p-6">
          <div className="text-sm text-green-700 mb-1">In Stock</div>
          <div className="text-3xl font-bold text-green-700">{stats.inStock}</div>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-md p-6">
          <div className="text-sm text-yellow-700 mb-1">Low Stock</div>
          <div className="text-3xl font-bold text-yellow-700">{stats.lowStock}</div>
        </div>
        <div className="bg-red-50 rounded-xl shadow-md p-6">
          <div className="text-sm text-red-700 mb-1">Out of Stock</div>
          <div className="text-3xl font-bold text-red-700">{stats.outOfStock}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'low'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setFilter('out')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'out'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Out of Stock
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Current Stock</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const status = getStockStatus(item.stock);
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center text-white font-bold">
                              {item.name[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{item.name}</div>
                          <div className="text-sm text-gray-600">₱{Number(item.price).toFixed(2)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{item.category}</td>
                    <td className="py-4 px-4">
                      <span className="text-xl font-bold text-gray-800">{item.stock}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStock(item.id, item.stock, -1)}
                          disabled={item.stock === 0}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStock(item.id, item.stock, 1)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No items found matching the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
