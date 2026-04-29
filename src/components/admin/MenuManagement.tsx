import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CreditCard as Edit, Trash2, X, Upload } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../ConfirmDialog';

type MenuItem = Database['public']['Tables']['menu_items']['Row'];

export function MenuManagement() {
  const { showToast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'CHICKEN',
    stock: '',
    image_url: '',
    is_available: true,
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        stock: Number(formData.stock),
        image_url: formData.image_url,
        is_available: formData.is_available,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([itemData]);

        if (error) throw error;
      }

      await fetchMenuItems();
      handleCloseModal();
      showToast('success', editingItem ? 'Menu item updated' : 'Menu item created');
    } catch (error) {
      console.error('Error saving menu item:', error);
      showToast('error', 'Error saving menu item');
    }
  };

  const handleDeleteClick = (item: MenuItem) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      await fetchMenuItems();
      showToast('success', 'Menu item deleted');
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting menu item:', error);
      showToast('error', 'Error deleting menu item');
      setItemToDelete(null);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setImagePreview(item.image_url);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      stock: item.stock.toString(),
      image_url: item.image_url,
      is_available: item.is_available,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setImagePreview('');
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'CHICKEN',
      stock: '',
      image_url: '',
      is_available: true,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrlData.publicUrl });
      showToast('success', 'Image uploaded');
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('error', 'Error uploading image. Please try again.');
      setImagePreview('');
    } finally {
      setUploading(false);
    }
  };

  const categories = ['All', 'CHICKEN', 'PORK', 'DRINKS', 'SIDE DISHES'];

  const filteredMenuItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  if (loading) {
    return <div className="text-center py-8">Loading menu items...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Menu Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage your food items</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:from-red-700 hover:to-red-600 transition shadow-lg text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Item
        </button>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredMenuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="h-48 bg-gradient-to-br from-yellow-400 to-red-500 flex items-center justify-center">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-white text-6xl font-bold">{item.name[0]}</div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="mb-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${
                  item.category === 'CHICKEN'
                    ? 'bg-yellow-100 text-yellow-800'
                    : item.category === 'PORK'
                    ? 'bg-orange-100 text-orange-800'
                    : item.category === 'DRINKS'
                    ? 'bg-blue-100 text-blue-800'
                    : item.category === 'SIDE DISHES'
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {item.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold text-red-600">₱{Number(item.price).toFixed(2)}</span>
                <span className="text-sm text-gray-600">Stock: {item.stock}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(item)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {editingItem ? 'Edit Menu Item' : 'Add New Item'}
                </h3>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition">
                        <div className="flex items-center justify-center gap-2">
                          <Upload className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">
                            {uploading ? 'Uploading...' : 'Click to upload image'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setFormData({ ...formData, image_url: '' });
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">Max 5MB. Supported: PNG, JPG, WebP, etc.</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="is_available" className="ml-2 text-sm font-medium text-gray-700">
                    Available for customers
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 transition font-semibold text-sm sm:text-base"
                  >
                    {editingItem ? 'Update' : 'Add'} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setItemToDelete(null)}
        type="danger"
      />
    </div>
  );
}
