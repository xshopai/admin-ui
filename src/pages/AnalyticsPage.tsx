import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    previousPeriod: number;
    trend: 'up' | 'down';
  };
  orders: {
    total: number;
    growth: number;
    avgOrderValue: number;
    conversionRate: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    growth: number;
  };
  products: {
    topSelling: Array<{
      id: string;
      name: string;
      sales: number;
      revenue: number;
    }>;
    lowStock: number;
  };
  traffic: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
}

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'orders', 'customers']);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API call
      setTimeout(() => {
        setAnalytics({
          revenue: {
            total: 125890.5,
            growth: 12.5,
            previousPeriod: 111850.0,
            trend: 'up',
          },
          orders: {
            total: 1247,
            growth: 8.3,
            avgOrderValue: 100.95,
            conversionRate: 3.2,
          },
          customers: {
            total: 3542,
            new: 428,
            returning: 819,
            growth: 15.7,
          },
          products: {
            topSelling: [
              { id: '1', name: 'Classic Cotton T-Shirt', sales: 345, revenue: 10350 },
              { id: '2', name: 'Wireless Bluetooth Headphones', sales: 289, revenue: 14450 },
              { id: '3', name: 'Leather Messenger Bag', sales: 178, revenue: 17800 },
              { id: '4', name: 'Running Shoes Pro', sales: 156, revenue: 15600 },
              { id: '5', name: 'Smart Watch Series 5', sales: 142, revenue: 42600 },
            ],
            lowStock: 23,
          },
          traffic: {
            pageViews: 45678,
            uniqueVisitors: 12345,
            bounceRate: 42.3,
            avgSessionDuration: 185,
          },
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    alert(`Exporting analytics report as ${format.toUpperCase()}...`);
    // Implement export functionality
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      case '90d':
        return 'Last 90 Days';
      case '1y':
        return 'Last Year';
      default:
        return 'Last 30 Days';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comprehensive business insights and metrics</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Time Range Filter */}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="btn btn-secondary pl-10"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Filters Toggle */}
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-secondary flex items-center gap-2">
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="btn btn-primary flex items-center gap-2">
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export Report
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('pdf')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
              >
                Export as Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Display Metrics</h3>
          <div className="flex flex-wrap gap-2">
            {['revenue', 'orders', 'customers', 'products', 'traffic'].map((metric) => (
              <label key={metric} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes(metric)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMetrics([...selectedMetrics, metric]);
                    } else {
                      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{metric}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        {selectedMetrics.includes('revenue') && (
          <div className="card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-gradient-to-br from-green-400 to-green-600 opacity-10 rounded-full"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${analytics.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
              >
                {analytics.revenue.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                {analytics.revenue.growth}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {formatCurrency(analytics.revenue.total)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              vs {formatCurrency(analytics.revenue.previousPeriod)} last period
            </p>
          </div>
        )}

        {/* Orders Card */}
        {selectedMetrics.includes('orders') && (
          <div className="card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-gradient-to-br from-blue-400 to-blue-600 opacity-10 rounded-full"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingBagIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                <ArrowTrendingUpIcon className="h-4 w-4" />
                {analytics.orders.growth}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {formatNumber(analytics.orders.total)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Avg: {formatCurrency(analytics.orders.avgOrderValue)} | Conv: {analytics.orders.conversionRate}%
            </p>
          </div>
        )}

        {/* Customers Card */}
        {selectedMetrics.includes('customers') && (
          <div className="card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-gradient-to-br from-purple-400 to-purple-600 opacity-10 rounded-full"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <UsersIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                <ArrowTrendingUpIcon className="h-4 w-4" />
                {analytics.customers.growth}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {formatNumber(analytics.customers.total)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              New: {analytics.customers.new} | Returning: {analytics.customers.returning}
            </p>
          </div>
        )}

        {/* Traffic Card */}
        {selectedMetrics.includes('traffic') && (
          <div className="card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-gradient-to-br from-orange-400 to-orange-600 opacity-10 rounded-full"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Page Views</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {formatNumber(analytics.traffic.pageViews)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Unique: {formatNumber(analytics.traffic.uniqueVisitors)} | Bounce: {analytics.traffic.bounceRate}%
            </p>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Chart visualization coming soon</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Integration with Chart.js or Recharts</p>
            </div>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Orders by Status</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Pie chart visualization coming soon</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Completed, Processing, Pending, Cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      {selectedMetrics.includes('products') && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Selling Products</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">{getTimeRangeLabel()}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.products.topSelling.map((product, index) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                          #{index + 1}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {formatNumber(product.sales)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-semibold">
                        {formatCurrency(product.revenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                          style={{ width: `${(product.sales / analytics.products.topSelling[0].sales) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Avg Session Duration</h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatDuration(analytics.traffic.avgSessionDuration)}
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Engagement metric for user experience</p>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Conversion Rate</h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.orders.conversionRate}%</p>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Visitors who completed a purchase</p>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Products Low Stock</h4>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analytics.products.lowStock}</p>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">Items requiring restocking</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
