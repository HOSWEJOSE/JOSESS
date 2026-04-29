import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Eye, X, Download, Calendar, Filter, Search, Loader, BarChart3, FileDown } from 'lucide-react';
import { Database } from '../../lib/database.types';
import html2pdf from 'html2pdf.js';

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

interface SalesReport {
  category: string;
  itemName: string;
  quantity: number;
  totalSales: number;
}

export function CompleteOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showSalesReport, setShowSalesReport] = useState(false);

  useEffect(() => {
    fetchCompleteOrders();

    const subscription = supabase
      .channel('complete-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchCompleteOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCompleteOrders = async () => {
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
        .eq('order_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as unknown as OrderWithDetails[]);
    } catch (error) {
      console.error('Error fetching complete orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.profiles.full_name.toLowerCase().includes(query)
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.created_at);

        switch (dateFilter) {
          case 'today':
            return orderDate >= startOfDay;
          case 'week':
            const weekAgo = new Date(startOfDay);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(startOfDay);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();
  const totalSales = filteredOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalOrders = filteredOrders.length;

  const generateSalesReport = (): SalesReport[] => {
    const reportMap = new Map<string, SalesReport>();

    console.log('Generating sales report from filtered orders:', filteredOrders.length);

    filteredOrders.forEach((order) => {
      console.log('Processing order:', order.order_number, 'Items:', order.order_items?.length);

      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item) => {
          if (item && item.menu_items && item.menu_items.name) {
            const key = `${item.menu_items.name}`;
            const existing = reportMap.get(key);

            if (existing) {
              existing.quantity += item.quantity;
              existing.totalSales += Number(item.subtotal);
            } else {
              reportMap.set(key, {
                category: 'Unknown',
                itemName: item.menu_items.name,
                quantity: item.quantity,
                totalSales: Number(item.subtotal),
              });
            }
          }
        });
      }
    });

    const result = Array.from(reportMap.values()).sort((a, b) => b.totalSales - a.totalSales);
    console.log('Sales report result:', result);
    return result;
  };

  const salesReport = generateSalesReport();
  const categoryTotals = salesReport.reduce((acc, item) => {
    acc[item.itemName] = (acc[item.itemName] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const downloadSalesReportPDF = () => {
    const totalQuantity = salesReport.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = salesReport.reduce((sum, item) => sum + item.totalSales, 0);
    const currentDate = new Date().toLocaleString();

    const dateFilterLabel = {
      'all': 'All Time',
      'today': 'Today',
      'week': 'This Week',
      'month': 'This Month',
    }[dateFilter];

    const tableRows = salesReport.length > 0
      ? salesReport.map((item) => {
          const percentOfTotal = (item.totalSales / (totalRevenue || 1)) * 100;
          return `<tr><td>${item.itemName}</td><td style="text-align:center;font-weight:bold;">${item.quantity}</td><td style="text-align:right;font-weight:bold;">₱${item.totalSales.toFixed(2)}</td><td style="text-align:right;">${percentOfTotal.toFixed(1)}%</td></tr>`;
        }).join('')
      : '<tr><td colspan="4" style="text-align:center;padding:20px;">No sales data available</td></tr>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
          <h1 style="margin: 0; font-size: 28px;">MR. CHANGE - Sales Report</h1>
          <p style="margin: 5px 0; color: #666;">Report Period: ${dateFilterLabel}</p>
          <p style="margin: 5px 0; color: #666;">Generated: ${currentDate}</p>
        </div>

        <div style="display: flex; justify-content: space-around; margin-bottom: 30px; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          <div style="text-align: center;">
            <label style="display: block; font-weight: bold; color: #666; margin-bottom: 5px; font-size: 12px;">Total Items Sold</label>
            <span style="display: block; font-size: 24px; font-weight: bold; color: #333;">${totalQuantity}</span>
          </div>
          <div style="text-align: center;">
            <label style="display: block; font-weight: bold; color: #666; margin-bottom: 5px; font-size: 12px;">Total Revenue</label>
            <span style="display: block; font-size: 24px; font-weight: bold; color: #333;">₱${totalRevenue.toFixed(2)}</span>
          </div>
          <div style="text-align: center;">
            <label style="display: block; font-weight: bold; color: #666; margin-bottom: 5px; font-size: 12px;">Unique Items</label>
            <span style="display: block; font-size: 24px; font-weight: bold; color: #333;">${salesReport.length}</span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="background-color: #333; color: white; padding: 12px; text-align: left; font-weight: bold;">Item Name</th>
              <th style="background-color: #333; color: white; padding: 12px; text-align: center; font-weight: bold;">Quantity</th>
              <th style="background-color: #333; color: white; padding: 12px; text-align: right; font-weight: bold;">Total Sales</th>
              <th style="background-color: #333; color: white; padding: 12px; text-align: right; font-weight: bold;">% of Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #333; text-align: center; color: #666; font-size: 12px;">
          <p>This is an official sales report. Please retain for your records.</p>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = htmlContent;

    const options = {
      margin: 10,
      filename: `sales-report-${dateFilter}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
  };

  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer', 'Total Amount', 'Payment Method', 'Order Date'];
    const rows = filteredOrders.map((order) => [
      order.order_number,
      order.profiles.full_name,
      Number(order.total_amount).toFixed(2),
      order.payment_method.toUpperCase(),
      new Date(order.created_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complete-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Complete Orders</h2>
          <p className="text-gray-600">Track completed orders and sales</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSalesReport(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-600 transition font-semibold shadow-lg"
          >
            <BarChart3 className="w-4 h-4" />
            Sales Report
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-600 transition font-semibold shadow-lg"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Completed Orders</h3>
          <p className="text-4xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl font-bold">₱</span>
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Total Sales</h3>
          <p className="text-4xl font-bold">₱{totalSales.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateFilter === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateFilter === 'today'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateFilter === 'week'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateFilter === 'month'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Complete Orders</h3>
          <p className="text-gray-500">
            {searchQuery || dateFilter !== 'all'
              ? 'No orders match your filters.'
              : 'Completed orders will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Order #</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Total Amount</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Payment</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-800">{order.order_number}</div>
                      <div className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        COMPLETE
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-800">{order.profiles.full_name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-lg font-bold text-red-600">₱{Number(order.total_amount).toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 uppercase">
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                      <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-500 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8" />
                  <h2 className="text-2xl font-bold">Order Complete</h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-gray-800 mb-2">{selectedOrder.order_number}</div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full font-bold">
                    <CheckCircle className="w-5 h-5" />
                    COMPLETE
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
            </div>
          </div>
        </div>
      )}

      {showSalesReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-500 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8" />
                  <h2 className="text-2xl font-bold">Sales Report</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadSalesReportPDF}
                    className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition font-semibold"
                  >
                    <FileDown className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowSalesReport(false)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-purple-700 font-medium mb-1">Total Items Sold</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {salesReport.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-700 font-medium mb-1">Total Revenue</div>
                  <div className="text-3xl font-bold text-blue-600">
                    ₱{salesReport.reduce((sum, item) => sum + item.totalSales, 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm text-orange-700 font-medium mb-1">Unique Items</div>
                  <div className="text-3xl font-bold text-orange-600">
                    {salesReport.length}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Item Sales Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Item Name</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Sales</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">% of Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesReport.map((item, index) => {
                        const percentOfTotal = (item.totalSales / (salesReport.reduce((sum, i) => sum + i.totalSales, 0) || 1)) * 100;
                        return (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-3 px-4 font-semibold text-gray-800">{item.itemName}</td>
                            <td className="py-3 px-4 text-center font-bold text-gray-700">{item.quantity}</td>
                            <td className="py-3 px-4 text-right font-bold text-purple-600">
                              ₱{item.totalSales.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">
                              {percentOfTotal.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {salesReport.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No sales data available for the selected period.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
