import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { returnsApi } from '../services/api';
import { Return, ReturnStats } from '../types';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

const ReturnsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<Return[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<Return[]>([]);
  const [stats, setStats] = useState<ReturnStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchReturns();
    fetchStats();
  }, [currentPage, statusFilter]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await returnsApi.getPaged({
        page: currentPage,
        pageSize: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      setReturns(response.data || []);
      setFilteredReturns(response.data || []);
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
      }
    } catch (err: any) {
      console.error('❌ Failed to fetch returns:', err);
      setError(err.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await returnsApi.getStats();
      setStats(response.data || {});
    } catch (err: any) {
      console.error('❌ Failed to fetch stats:', err);
    }
  };

  // Search filter
  useEffect(() => {
    if (searchTerm) {
      const filtered = returns.filter(
        (ret) =>
          ret.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ret.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ret.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ret.customerName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredReturns(filtered);
    } else {
      setFilteredReturns(returns);
    }
  }, [searchTerm, returns]);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Status badge variant
  const getStatusVariant = (status: string): 'info' | 'success' | 'danger' | 'warning' | 'default' => {
    switch (status) {
      case 'Requested':
        return 'info';
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'danger';
      case 'ItemsReceived':
      case 'Inspecting':
        return 'warning';
      case 'Completed':
      case 'RefundProcessed':
        return 'success';
      default:
        return 'default';
    }
  };

  // Calculate total returns from stats
  const totalReturns = Object.values(stats).reduce((sum, count) => sum + (count || 0), 0);

  if (loading && returns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns Management</h1>
          <p className="text-gray-600 mt-1">Manage customer return requests and refunds</p>
        </div>
        <button
          onClick={() => fetchReturns()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalReturns}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Requested</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.Requested || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.Approved || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Refund Processed</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.RefundProcessed || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by return number, order number, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status ({totalReturns})</option>
            <option value="Requested">Requested ({stats.Requested || 0})</option>
            <option value="Approved">Approved ({stats.Approved || 0})</option>
            <option value="Rejected">Rejected ({stats.Rejected || 0})</option>
            <option value="ItemsReceived">Items Received ({stats.ItemsReceived || 0})</option>
            <option value="Inspecting">Inspecting ({stats.Inspecting || 0})</option>
            <option value="Completed">Completed ({stats.Completed || 0})</option>
            <option value="RefundProcessed">Refund Processed ({stats.RefundProcessed || 0})</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return Number</TableHead>
              <TableHead>Order Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Refund Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReturns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <ArrowPathIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No returns found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredReturns.map((returnItem) => (
                <TableRow key={returnItem.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{returnItem.returnNumber}</TableCell>
                  <TableCell>{returnItem.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{returnItem.customerName}</p>
                      <p className="text-sm text-gray-500">{returnItem.customerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(returnItem.status)}>{returnItem.status}</Badge>
                  </TableCell>
                  <TableCell>{returnItem.items.length}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    ${returnItem.totalRefundAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>{formatDate(returnItem.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => navigate(`/returns/${returnItem.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsDashboard;
