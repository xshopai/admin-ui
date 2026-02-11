import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TruckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { returnsApi } from '../services/api';
import { Return } from '../types';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const ReturnDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [returnData, setReturnData] = useState<Return | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (id) {
      fetchReturn();
    }
  }, [id]);

  const fetchReturn = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await returnsApi.getById(id);
      setReturnData(response.data);
    } catch (err: any) {
      console.error('❌ Failed to fetch return:', err);
      setError(err.message || 'Failed to load return details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!returnData) return;

    try {
      setProcessing(true);
      await returnsApi.updateStatus(returnData.id, {
        status: 'Approved',
        notes: notes.trim() || undefined,
      });
      setIsApproveModalOpen(false);
      setNotes('');
      await fetchReturn();
    } catch (err: any) {
      console.error('❌ Failed to approve return:', err);
      alert(err.message || 'Failed to approve return');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!returnData || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      await returnsApi.updateStatus(returnData.id, {
        status: 'Rejected',
        rejectionReason: rejectionReason.trim(),
      });
      setIsRejectModalOpen(false);
      setRejectionReason('');
      await fetchReturn();
    } catch (err: any) {
      console.error('❌ Failed to reject return:', err);
      alert(err.message || 'Failed to reject return');
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!returnData || !newStatus) {
      alert('Please select a status');
      return;
    }

    try {
      setProcessing(true);
      await returnsApi.updateStatus(returnData.id, {
        status: newStatus,
        notes: notes.trim() || undefined,
      });
      setIsStatusModalOpen(false);
      setNewStatus('');
      setNotes('');
      await fetchReturn();
    } catch (err: any) {
      console.error('❌ Failed to update status:', err);
      alert(err.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Requested':
        return ClockIcon;
      case 'Approved':
        return CheckCircleIcon;
      case 'Rejected':
        return XCircleIcon;
      case 'ItemsReceived':
        return TruckIcon;
      case 'Inspecting':
        return ClockIcon;
      case 'Completed':
      case 'RefundProcessed':
        return CheckCircleIcon;
      default:
        return ClockIcon;
    }
  };

  // Check if can approve/reject
  const canApprove = returnData?.status === 'Requested';
  const canUpdateStatus = returnData?.status !== 'Rejected' && returnData?.status !== 'RefundProcessed';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !returnData) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/returns')} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Returns
        </button>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Return</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={fetchReturn} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(returnData.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/returns')} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Returns
        </button>
      </div>

      {/* Return Status Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Return #{returnData.returnNumber}</h1>
              <p className="text-blue-100 mt-1">Order #{returnData.orderNumber}</p>
            </div>
            <StatusIcon className="h-12 w-12" />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <Badge variant={getStatusVariant(returnData.status)} className="text-lg px-4 py-2">
              {returnData.status}
            </Badge>

            <div className="flex gap-2">
              {canApprove && (
                <>
                  <button
                    onClick={() => setIsApproveModalOpen(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    Reject
                  </button>
                </>
              )}
              {canUpdateStatus && (
                <button
                  onClick={() => setIsStatusModalOpen(true)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Update Status
                </button>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{returnData.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{returnData.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Requested</p>
                <p className="font-medium text-gray-900">{formatDate(returnData.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-medium text-gray-900">{returnData.orderNumber}</p>
              </div>
            </div>
          </div>

          {/* Return Details */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Return Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-medium text-gray-900">{returnData.reason}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-700">{returnData.description}</p>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          {returnData.status === 'Rejected' && returnData.rejectionReason && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">Rejection Reason</h3>
                    <p className="text-red-800">{returnData.rejectionReason}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {returnData.notes && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Admin Notes</h3>
              <p className="text-gray-700">{returnData.notes}</p>
            </div>
          )}

          {/* Approval/Processing Info */}
          {returnData.approvedAt && (
            <div className="border-t border-gray-200 pt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Return Approved</h3>
                <p className="text-green-800">
                  Approved on {formatDate(returnData.approvedAt)}
                  {returnData.approvedBy && ` by ${returnData.approvedBy}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Return Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Return Items</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {returnData.items.map((item, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                {item.productImageUrl && (
                  <img
                    src={item.productImageUrl}
                    alt={item.productName}
                    className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.productName}</h3>
                  <p className="text-sm text-gray-600 mt-1">Unit Price: ${item.unitPrice.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantityToReturn}</p>
                  {item.itemCondition && <p className="text-sm text-gray-600">Condition: {item.itemCondition}</p>}
                  <p className="text-sm font-semibold text-gray-900 mt-2">Refund: ${item.refundAmount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Refund Summary */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Refund Summary</h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Items Refund</span>
              <span className="font-medium text-gray-900">${returnData.itemsRefundAmount.toFixed(2)}</span>
            </div>
            {returnData.shippingRefundAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Shipping Refund</span>
                <span className="font-medium text-gray-900">${returnData.shippingRefundAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Refund</span>
              <span className="text-2xl font-bold text-green-600">${returnData.totalRefundAmount.toFixed(2)}</span>
            </div>
          </div>

          {returnData.status === 'RefundProcessed' && returnData.refundProcessedAt && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">✓ Refund processed on {formatDate(returnData.refundProcessedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Return Timeline</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Created */}
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Return Requested</p>
                <p className="text-sm text-gray-600">{formatDate(returnData.createdAt)}</p>
              </div>
            </div>

            {/* Approved */}
            {returnData.approvedAt && (
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Return Approved</p>
                  <p className="text-sm text-gray-600">{formatDate(returnData.approvedAt)}</p>
                  {returnData.approvedBy && <p className="text-sm text-gray-600">by {returnData.approvedBy}</p>}
                </div>
              </div>
            )}

            {/* Items Received */}
            {returnData.itemsReceivedAt && (
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Items Received</p>
                  <p className="text-sm text-gray-600">{formatDate(returnData.itemsReceivedAt)}</p>
                </div>
              </div>
            )}

            {/* Completed */}
            {returnData.completedAt && (
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Return Completed</p>
                  <p className="text-sm text-gray-600">{formatDate(returnData.completedAt)}</p>
                  {returnData.processedBy && <p className="text-sm text-gray-600">by {returnData.processedBy}</p>}
                </div>
              </div>
            )}

            {/* Refund Processed */}
            {returnData.refundProcessedAt && (
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Refund Processed</p>
                  <p className="text-sm text-gray-600">{formatDate(returnData.refundProcessedAt)}</p>
                </div>
              </div>
            )}

            {/* Rejected */}
            {returnData.status === 'Rejected' && returnData.rejectedAt && (
              <div className="flex items-start gap-3">
                <XCircleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Return Rejected</p>
                  <p className="text-sm text-gray-600">{formatDate(returnData.rejectedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Approve Return" size="md">
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to approve this return? The customer will be notified and can ship the items back.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this approval..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsApproveModalOpen(false)}
              disabled={processing}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              {processing ? 'Approving...' : 'Approve Return'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Return" size="md">
        <div className="space-y-4">
          <p className="text-gray-600">Please provide a reason for rejecting this return request.</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this return is being rejected..."
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              disabled={processing}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              {processing ? 'Rejecting...' : 'Reject Return'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Return Status"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status <span className="text-red-500">*</span>
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select status...</option>
              <option value="ItemsReceived">Items Received</option>
              <option value="Inspecting">Inspecting</option>
              <option value="Completed">Completed</option>
              <option value="RefundProcessed">Refund Processed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this status update..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsStatusModalOpen(false)}
              disabled={processing}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleStatusUpdate}
              disabled={processing || !newStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {processing ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReturnDetailPage;
