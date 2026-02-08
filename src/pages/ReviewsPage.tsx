import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { reviewsApi } from '../services/api';
import { Review } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

const ReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    averageRating: 0,
  });

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, []);

  const filterReviews = useCallback(() => {
    let filtered = [...reviews];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (review) =>
          review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((review) => review.status === statusFilter);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter((review) => review.rating === parseInt(ratingFilter));
    }

    setFilteredReviews(filtered);
  }, [reviews, searchTerm, statusFilter, ratingFilter]);

  useEffect(() => {
    filterReviews();
  }, [filterReviews]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewsApi.getAll({
        page: 1,
        limit: 100,
      });

      // Transform backend data to frontend format
      const transformedReviews: Review[] = (response.data || []).map((review: any) => ({
        id: review._id || review.id,
        productId: review.productId,
        product: review.product,
        userId: review.userId,
        // Backend now provides enriched user data
        user: review.user
          ? ({
              id: review.user.userId || review.userId,
              firstName: review.user.firstName,
              lastName: review.user.lastName,
              email: review.user.email,
              role: 'customer',
              roles: ['customer'],
              status: 'active',
              createdAt: review.user.createdAt || review.createdAt,
            } as User)
          : undefined,
        rating: review.rating,
        title: review.title || '',
        comment: review.comment || '',
        status: review.status,
        createdAt: review.createdAt || review.metadata?.createdAt,
        verified: review.isVerifiedPurchase || review.verifiedPurchase,
        helpfulVotes: review.helpfulVotes || { helpful: 0, notHelpful: 0 },
      }));

      setReviews(transformedReviews);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reviews');
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await reviewsApi.getStats();
      const statsData = response.data || {};
      setStats({
        total: statsData.total || 0,
        pending: statsData.pending || 0,
        approved: statsData.approved || 0,
        averageRating: statsData.averageRating || 0,
      });
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      // Keep default stats on error
      setStats({
        total: 0,
        pending: 0,
        approved: 0,
        averageRating: 0,
      });
    }
  };

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setIsViewModalOpen(true);
  };

  const handleDeleteReview = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteModalOpen(true);
  };

  const handleApproveReview = async (review: Review) => {
    try {
      await reviewsApi.updateStatus(review.id, 'approved');
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve review');
    }
  };

  const handleRejectReview = async (review: Review) => {
    try {
      await reviewsApi.updateStatus(review.id, 'rejected');
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject review');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedReview) return;

    try {
      await reviewsApi.delete(selectedReview.id);
      setIsDeleteModalOpen(false);
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= rating ? (
              <StarIconSolid className="h-4 w-4 text-yellow-400" />
            ) : (
              <StarIcon className="h-4 w-4 text-gray-300 dark:text-gray-600" />
            )}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center" />

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews by title, comment, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Filter Toggle */}
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-secondary flex items-center gap-2">
            <FunnelIcon className="h-5 w-5" />
            Filters
            {(statusFilter !== 'all' || ratingFilter !== 'all') && (
              <span className="ml-1 bg-blue-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                {(statusFilter !== 'all' ? 1 : 0) + (ratingFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.approved}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.averageRating}</p>
            <StarIconSolid className="h-6 w-6 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User & Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No reviews found
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {[review.user?.firstName, review.user?.lastName].filter(Boolean).join(' ') ||
                          review.user?.email ||
                          'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {review.product?.name || 'Product'}
                        {review.verified && <span className="ml-2 text-green-600 dark:text-green-400">✓ Verified</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{renderStars(review.rating)}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {review.title && <div className="font-medium text-sm truncate">{review.title}</div>}
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{review.comment}</div>
                      {review.helpfulVotes && review.helpfulVotes.helpful > 0 && (
                        <div className="text-xs text-gray-400 mt-1">{review.helpfulVotes.helpful} found helpful</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(review.status)}>{review.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{new Date(review.createdAt).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveReview(review)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                            title="Approve review"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleRejectReview(review)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Reject review"
                          >
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewReview(review)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-xs font-medium"
                        title="View details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Delete review"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Review Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Review Details" size="lg">
        {selectedReview && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User</label>
              <p className="text-gray-900 dark:text-white">
                {[selectedReview.user?.firstName, selectedReview.user?.lastName].filter(Boolean).join(' ') ||
                  selectedReview.user?.email}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedReview.user?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
              <p className="text-gray-900 dark:text-white">{selectedReview.product?.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
              {renderStars(selectedReview.rating)}
            </div>

            {selectedReview.title && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <p className="text-gray-900 dark:text-white">{selectedReview.title}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comment</label>
              <p className="text-gray-900 dark:text-white">{selectedReview.comment}</p>
            </div>

            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <Badge variant={getStatusBadgeVariant(selectedReview.status)}>{selectedReview.status}</Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Verified Purchase
                </label>
                <p className="text-gray-900 dark:text-white">{selectedReview.verified ? 'Yes' : 'No'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Helpful Votes</label>
                <p className="text-gray-900 dark:text-white">
                  {selectedReview.helpfulVotes
                    ? `${selectedReview.helpfulVotes.helpful} helpful, ${selectedReview.helpfulVotes.notHelpful} not helpful`
                    : '0 votes'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <p className="text-gray-900 dark:text-white">{new Date(selectedReview.createdAt).toLocaleString()}</p>
            </div>

            {selectedReview.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    handleRejectReview(selectedReview);
                    setIsViewModalOpen(false);
                  }}
                  className="btn bg-red-600 hover:bg-red-700 text-white"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    handleApproveReview(selectedReview);
                    setIsViewModalOpen(false);
                  }}
                  className="btn bg-green-600 hover:bg-green-700 text-white"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Review" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this review from{' '}
            <strong>
              {[selectedReview?.user?.firstName, selectedReview?.user?.lastName].filter(Boolean).join(' ') ||
                selectedReview?.user?.email}
            </strong>
            ? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleConfirmDelete} className="btn bg-red-600 hover:bg-red-700 text-white">
              Delete Review
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReviewsPage;
