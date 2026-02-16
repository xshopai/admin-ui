import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  UsersIcon,
  ShoppingBagIcon,
  CubeIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { dashboardApi } from '../services/api';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: dashboardData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-complete'],
    queryFn: () => dashboardApi.getStats(true, 5),
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

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

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    alert(`Exporting dashboard report as ${format.toUpperCase()}...`);
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

  const defaultStats = {
    users: {
      total: 0,
      active: 0,
      newThisMonth: 0,
      growth: 0,
      customers: 0,
      newCustomersThisMonth: 0,
      customerGrowth: 0,
    },
    orders: { total: 0, pending: 0, processing: 0, completed: 0, revenue: 0, growth: 0 },
    products: { total: 0, active: 0, lowStock: 0, outOfStock: 0 },
    reviews: { total: 0, pending: 0, averageRating: 0, growth: 0 },
    recentOrders: [],
    recentUsers: [],
  };
  const stats = {
    ...defaultStats,
    ...dashboardData?.data,
    recentOrders: dashboardData?.data?.recentOrders || [],
    recentUsers: dashboardData?.data?.recentUsers || [],
  };

  // Calculate analytics from stats (frontend calculations)
  const analytics = {
    revenue: {
      total: stats.orders.revenue,
      growth: stats.orders.growth,
      trend: (stats.orders.growth >= 0 ? 'up' : 'down') as 'up' | 'down',
    },
    orders: {
      total: stats.orders.total,
      growth: stats.orders.growth,
      avgOrderValue: stats.orders.total > 0 ? stats.orders.revenue / stats.orders.total : 0,
      conversionRate: 0, // TODO: Calculate when we have visitor tracking
    },
    customers: {
      // Use customer-specific stats (excluding admins)
      total: stats.users.customers,
      new: stats.users.newCustomersThisMonth,
      returning: Math.max(0, stats.users.customers - stats.users.newCustomersThisMonth),
      growth: stats.users.customerGrowth,
    },
  };

  if (statsLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const ranges: Array<'7d' | '30d' | '90d' | '1y'> = ['7d', '30d', '90d', '1y'];
              const currentIndex = ranges.indexOf(timeRange);
              setTimeRange(ranges[(currentIndex + 1) % ranges.length]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            title="Note: Time range filter for top products coming soon. Currently showing all-time data."
          >
            <CalendarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getTimeRangeLabel()}</span>
          </button>

          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Export</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('pdf')}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors"
              >
                Export as Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Business Metrics */}
      {!statsLoading && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-gray-500" />
              Key Business Metrics
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">TODO: Time-based filtering coming soon</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Revenue Card */}
            <div className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                  <CurrencyDollarIcon className="h-7 w-7 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${analytics.revenue.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                >
                  {analytics.revenue.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                  )}
                  {Math.abs(analytics.revenue.growth).toFixed(1)}%
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {formatCurrency(analytics.revenue.total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avg order value: {formatCurrency(analytics.revenue.total / (analytics.orders.total || 1))}
              </p>
            </div>

            {/* Orders Card */}
            <div className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                  <ShoppingBagIcon className="h-7 w-7 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${analytics.orders.growth >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                >
                  {analytics.orders.growth >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                  )}
                  {Math.abs(analytics.orders.growth).toFixed(1)}%
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Orders</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {formatNumber(analytics.orders.total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Conversion rate: {analytics.orders.conversionRate}%
              </p>
            </div>

            {/* Customers Card */}
            <div className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-md">
                  <UsersIcon className="h-7 w-7 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${analytics.customers.growth >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}
                >
                  {analytics.customers.growth >= 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                  )}
                  {Math.abs(analytics.customers.growth).toFixed(1)}%
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Customers</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {formatNumber(analytics.customers.total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                +{formatNumber(analytics.customers.new)} new • {formatNumber(analytics.customers.returning)} returning
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Store Overview */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CubeIcon className="h-5 w-5 text-gray-500" />
          Store Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CubeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.products.total}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
              </div>
            </div>
          </div>

          <div className="card p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <StarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.reviews.averageRating.toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Rating</p>
              </div>
            </div>
          </div>

          <div className="card p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <UsersIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.users.active || stats.users.total}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
              </div>
            </div>
          </div>

          <div className="card p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <ShoppingBagIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.orders.completed}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed Orders</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alerts & Actions Needed */}
      {(stats.orders.pending > 0 || stats.products.lowStock > 0 || stats.reviews.pending > 0) && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
            Attention Required
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.orders.pending > 0 && (
              <div
                onClick={() => navigate('/orders')}
                className="card p-4 border-l-4 border-red-500 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.orders.pending}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending Orders</p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-medium">Need immediate attention →</p>
              </div>
            )}

            {stats.products.lowStock > 0 && (
              <div
                onClick={() => navigate('/inventory')}
                className="card p-4 border-l-4 border-yellow-500 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.products.lowStock}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Low Stock Items</p>
                  </div>
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3 font-medium">Restock soon →</p>
              </div>
            )}

            {stats.reviews.pending > 0 && (
              <div
                onClick={() => navigate('/reviews')}
                className="card p-4 border-l-4 border-blue-500 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.reviews.pending}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Pending Reviews</p>
                  </div>
                  <StarIcon className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 font-medium">Review & approve →</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Orders */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
              <button
                onClick={() => navigate('/orders')}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {stats.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {order.customer} • {order.itemCount || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">${order.total}</p>
                    <span
                      className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full mt-1 ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : order.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : order.status === 'shipped'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Users</h3>
              <button
                onClick={() => navigate('/users')}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                View all →
              </button>
            </div>
            <div className="space-y-3">
              {stats.recentUsers.map((user: any) => (
                <div
                  key={user.id}
                  onClick={() => navigate(`/users/${user.id}`)}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {(user.firstName || user.email)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/users/add')}
            className="card p-4 text-left hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit mb-3">
              <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Add New User</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create admin or customer account</p>
          </button>

          <button
            onClick={() => navigate('/products')}
            className="card p-4 text-left hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit mb-3">
              <CubeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Add Product</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create new product listing</p>
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="card p-4 text-left hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit mb-3">
              <ShoppingBagIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Process Orders</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review pending orders</p>
          </button>

          <button
            onClick={() => navigate('/reviews')}
            className="card p-4 text-left hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg w-fit mb-3">
              <StarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Review Management</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Moderate customer reviews</p>
          </button>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
