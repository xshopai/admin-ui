import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  TruckIcon,
  CreditCardIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { ordersApi } from '../services/api';
import logger from '../utils/logger';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Get the page we came from (default to /orders if not specified)
  const fromPath = (location.state as any)?.from || '/orders';

  // Fetch order details
  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

  // Fetch payment details for this order
  const { data: paymentData, isLoading: isLoadingPayment } = useQuery({
    queryKey: ['order-payment', id],
    queryFn: () => ordersApi.getPayment(id!),
    enabled: !!id,
    retry: false, // Don't retry if payment not found
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status, paymentStatus, shippingStatus }: any) =>
      ordersApi.updateStatus(id!, status, paymentStatus, shippingStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      logger.info('Order status updated successfully', { orderId: id });
    },
    onError: (error: any) => {
      logger.error('Failed to update order status', { error, orderId: id });
    },
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: () => ordersApi.confirmPayment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['order-payment', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      logger.info('Payment confirmed successfully', { orderId: id });
      alert('Payment confirmed! Order will advance to shipping preparation.');
    },
    onError: (error: any) => {
      logger.error('Failed to confirm payment', { error, orderId: id });
      alert('Failed to confirm payment: ' + (error.message || 'Unknown error'));
    },
  });

  // Reject payment mutation
  const rejectPaymentMutation = useMutation({
    mutationFn: (reason: string) => ordersApi.rejectPayment(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['order-payment', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowRejectModal(false);
      setRejectReason('');
      logger.info('Payment rejected', { orderId: id });
      alert('Payment rejected. Order will be cancelled.');
    },
    onError: (error: any) => {
      logger.error('Failed to reject payment', { error, orderId: id });
      alert('Failed to reject payment: ' + (error.message || 'Unknown error'));
    },
  });

  const order = orderData?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Order not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The order you're looking for doesn't exist or has been deleted.
        </p>
        <button onClick={() => navigate(fromPath)} className="mt-4 btn-primary inline-flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </button>
      </div>
    );
  }

  const handleStatusUpdate = (status: string, paymentStatus?: string, shippingStatus?: string) => {
    if (window.confirm(`Are you sure you want to update this order status to ${status}?`)) {
      updateStatusMutation.mutate({ status, paymentStatus, shippingStatus });
    }
  };

  const getStatusColor = (status: string | undefined | null) => {
    const statusMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };
    return statusMap[status?.toLowerCase() || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getPaymentStatusIcon = (status: string | undefined | null) => {
    if (!status) return <ClockIcon className="h-5 w-5 text-gray-500" />;
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'completed' || s === 'succeeded')
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    if (s === 'failed' || s === 'refunded') return <XCircleIcon className="h-5 w-5 text-red-500" />;
    return <ClockIcon className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(fromPath)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={`Back to ${fromPath === '/dashboard' ? 'Dashboard' : 'Orders'}`}
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
              {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.productImageUrl ? (
                          <img
                            src={item.productImageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML =
                                '<span class="text-xs text-gray-500 dark:text-gray-400">No Image</span>';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">No Image</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Product ID: {item.productId}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          ${item.unitPrice.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No items found</p>
              )}
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-900 dark:text-white">${order.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="text-gray-900 dark:text-white">${order.taxAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                <span className="text-gray-900 dark:text-white">${order.shippingCost?.toFixed(2) || '0.00'}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information & Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Customer Information
              </h2>
              <div className="space-y-3">
                {/* Name - from order.customerName or extract from shipping address */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {order.customerName ||
                      order.shippingAddress?.fullName ||
                      order.shippingAddress?.addressLine1?.split(',')[0] ||
                      'Not available'}
                  </p>
                </div>
                {/* Email */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  {order.customerEmail ? (
                    <p className="text-sm font-medium">
                      <a
                        href={`mailto:${order.customerEmail}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {order.customerEmail}
                      </a>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Not available</p>
                  )}
                </div>
                {/* Phone */}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  {order.customerPhone ? (
                    <p className="text-sm font-medium">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {order.customerPhone}
                      </a>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Not available</p>
                  )}
                </div>
                {/* Customer ID with View Profile link */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customer ID</p>
                  <div className="flex items-center justify-between">
                    <p
                      className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate max-w-[150px]"
                      title={order.customerId}
                    >
                      {order.customerId}
                    </p>
                    <button
                      onClick={() => navigate(`/users/${order.customerId}`)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Profile →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping & Billing Addresses - now in same row */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TruckIcon className="h-5 w-5 mr-2" />
                  Shipping Address
                </h2>
                {order.shippingAddress ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No shipping address provided</p>
                )}
              </div>

              {/* Billing Address */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  Billing Address
                </h2>
                {order.billingAddress ? (
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>{order.billingAddress.addressLine1}</p>
                    {order.billingAddress.addressLine2 && <p>{order.billingAddress.addressLine2}</p>}
                    <p>
                      {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}
                    </p>
                    <p>{order.billingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No billing address provided</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-6">
          {/* Order Status */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Status</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Order Status</p>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="Created">Created</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Payment Status</p>
                <div className="flex items-center space-x-2">
                  {getPaymentStatusIcon(order.paymentStatus)}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {order.paymentStatus || 'Unknown'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Shipping Status</p>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{order.shippingStatus}</span>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Order Created</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {order.updatedAt !== order.createdAt && (
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <ClockIcon className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Last Updated</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(order.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Payment Details
            </h2>

            {isLoadingPayment ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading payment info...</div>
            ) : paymentData?.data ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Payment ID</p>
                  <p className="text-xs font-mono text-gray-900 dark:text-white break-all">
                    {paymentData.data.id || paymentData.data.paymentId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                  <div className="flex items-center space-x-2">
                    {getPaymentStatusIcon(paymentData.data.status)}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {paymentData.data.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${paymentData.data.amount?.toFixed(2)} {paymentData.data.currency || 'USD'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p>
                  <p className="text-sm text-gray-900 dark:text-white">{paymentData.data.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Provider</p>
                  <p className="text-sm text-gray-900 dark:text-white">{paymentData.data.provider || 'N/A'}</p>
                </div>
                {paymentData.data.providerTransactionId && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Transaction ID</p>
                    <p className="text-xs font-mono text-gray-900 dark:text-white break-all">
                      {paymentData.data.providerTransactionId}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Processed At</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {paymentData.data.createdAt ? new Date(paymentData.data.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>

                {/* Payment Action Buttons */}
                {(paymentData.data.status?.toLowerCase() === 'succeeded' ||
                  paymentData.data.status?.toLowerCase() === 'processing') &&
                  order.paymentStatus?.toLowerCase() === 'pending' && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Payment has been processed. Verify and confirm to advance the order.
                      </p>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              'Are you sure you want to confirm this payment? This will advance the order to shipping preparation.',
                            )
                          ) {
                            confirmPaymentMutation.mutate();
                          }
                        }}
                        disabled={confirmPaymentMutation.isPending}
                        className="w-full btn-primary text-sm flex items-center justify-center disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        {confirmPaymentMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={rejectPaymentMutation.isPending}
                        className="w-full btn-danger text-sm flex items-center justify-center disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4 mr-2" />
                        Reject Payment
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">No payment record found for this order.</p>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Order Amount</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${order.totalAmount.toFixed(2)} {order.currency || 'USD'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
            <div className="space-y-2">
              <button onClick={() => window.print()} className="w-full btn-secondary text-sm">
                Print Order
              </button>
              <button
                onClick={() => handleStatusUpdate('Cancelled')}
                disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                className="w-full btn-danger text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Payment Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reject Payment</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will mark the payment as failed and trigger order cancellation.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for rejection
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                rows={3}
                placeholder="Enter reason for rejecting this payment..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectPaymentMutation.mutate(rejectReason || 'Payment rejected by admin')}
                disabled={rejectPaymentMutation.isPending}
                className="flex-1 btn-danger text-sm disabled:opacity-50"
              >
                {rejectPaymentMutation.isPending ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
