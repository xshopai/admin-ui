import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { productsApi, inventoryApi } from '../services/api';
import { Product } from '../types';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

// Extended product type with variants from backend
interface ProductVariant {
  sku: string;
  color?: string;
  size?: string;
  initial_stock?: number;
}

interface ProductWithVariants extends Product {
  variants?: ProductVariant[];
}

// Inventory data type
interface InventoryData {
  sku: string;
  quantityAvailable: number;
  quantityReserved: number;
}

// Product thumbnail component with fallback for broken images
const ProductThumbnail: React.FC<{ src?: string; alt: string; size?: 'sm' | 'md' }> = ({ src, alt, size = 'md' }) => {
  const [hasError, setHasError] = useState(false);
  const sizeClasses = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  if (!src || hasError) {
    return (
      <div className={`${sizeClasses} rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
        <PhotoIcon className={`${iconSize} text-gray-400`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses} rounded object-cover`}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

// Stock status badge component
const StockBadge: React.FC<{ quantity: number }> = ({ quantity }) => {
  if (quantity === 0) {
    return <Badge variant="error">Out of Stock</Badge>;
  } else if (quantity < 10) {
    return <Badge variant="warning">Low ({quantity})</Badge>;
  }
  return <Badge variant="success">{quantity}</Badge>;
};

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Expandable row states
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [loadingInventory, setLoadingInventory] = useState<Set<string>>(new Set());
  const [inventoryCache, setInventoryCache] = useState<Record<string, InventoryData>>({});

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariants | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    subcategory: '',
    brand: '',
    sku: '',
    status: 'active' as 'active' | 'inactive' | 'draft',
    stock: 0,
    tags: [] as string[],
    images: [] as string[],
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const filterProducts = useCallback(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((product) => product.status === statusFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productsApi.getAll({}); // Fetch all products (no limit)

      console.log('Products API response:', response);

      // The BFF returns { success: true, data: [...products], pagination: {...} }
      // response.data is the array of products
      const productsArray = Array.isArray(response.data) ? response.data : [];

      // Transform the backend data to match our Product interface
      const transformedProducts = productsArray.map((product: any) => ({
        id: product._id || product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category || product.taxonomy?.category,
        subcategory: product.subcategory || product.taxonomy?.subcategory,
        brand: product.brand,
        sku: product.sku,
        status: product.is_active ? ('active' as const) : ('inactive' as const),
        stock: product.stock || 0,
        images: product.images || [],
        tags: product.tags || [],
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        createdBy: product.created_by,
        // Include variants from backend
        variants: product.variants || [],
      }));

      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle expand/collapse for a product row
  const toggleExpand = async (productId: string, variants: ProductVariant[]) => {
    const newExpanded = new Set(expandedProducts);

    if (newExpanded.has(productId)) {
      // Collapse
      newExpanded.delete(productId);
    } else {
      // Expand and fetch inventory if not cached
      newExpanded.add(productId);

      // Get SKUs that need inventory data
      const skusToFetch = variants.filter((v) => v.sku && !inventoryCache[v.sku]).map((v) => v.sku);

      if (skusToFetch.length > 0) {
        setLoadingInventory((prev) => new Set([...Array.from(prev), productId]));

        try {
          const inventoryData = await inventoryApi.getBatch(skusToFetch);
          setInventoryCache((prev) => ({ ...prev, ...inventoryData }));
        } catch (err) {
          console.error('Failed to fetch inventory:', err);
        } finally {
          setLoadingInventory((prev) => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        }
      }
    }

    setExpandedProducts(newExpanded);
  };

  // Calculate total stock from variants
  const getTotalStock = (variants: ProductVariant[]): number => {
    if (!variants || variants.length === 0) return 0;
    return variants.reduce((sum, variant) => {
      const inv = inventoryCache[variant.sku];
      return sum + (inv?.quantityAvailable || 0);
    }, 0);
  };

  // Check if inventory is loaded for a product's variants
  const hasInventoryLoaded = (variants: ProductVariant[]): boolean => {
    if (!variants || variants.length === 0) return true;
    return variants.every((v) => v.sku in inventoryCache);
  };

  // Format variant attributes for display
  const formatVariantLabel = (variant: ProductVariant): string => {
    const parts = [];
    if (variant.color) parts.push(variant.color);
    if (variant.size) parts.push(variant.size);
    return parts.length > 0 ? parts.join(' / ') : variant.sku;
  };

  const handleCreateProduct = () => {
    navigate('/products/add');
  };

  const handleEditProduct = (product: ProductWithVariants) => {
    navigate(`/products/edit/${product.id}`);
  };

  const handleDeleteProduct = (product: ProductWithVariants) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleReactivateProduct = (product: ProductWithVariants) => {
    setSelectedProduct(product);
    setIsReactivateModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!selectedProduct) return;

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        subcategory: formData.subcategory,
        brand: formData.brand,
        sku: formData.sku,
        is_active: formData.status === 'active',
        tags: formData.tags,
        images: formData.images,
      };

      await productsApi.update(selectedProduct.id, updateData);
      setIsEditModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleCreateProductSubmit = async () => {
    try {
      const createData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        subcategory: formData.subcategory,
        brand: formData.brand,
        sku: formData.sku,
        is_active: formData.status === 'active',
        tags: formData.tags,
        images: formData.images,
      };

      await productsApi.create(createData);
      setIsCreateModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      await productsApi.delete(selectedProduct.id);
      setIsDeleteModalOpen(false);
      // Invalidate dashboard stats to reflect deleted product count
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleConfirmReactivate = async () => {
    if (!selectedProduct) return;

    try {
      await productsApi.reactivate(selectedProduct.id);
      setIsReactivateModalOpen(false);
      // Invalidate dashboard stats to reflect reactivated product count
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reactivate product');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getUniqueCategories = () => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
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
      <div className="flex justify-between items-center">
        <button onClick={handleCreateProduct} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Add New Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, description, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Filter Toggle */}
          <button onClick={() => setShowFilters(!showFilters)} className="btn btn-secondary flex items-center gap-2">
            <FunnelIcon className="h-5 w-5" />
            Filters
            {(categoryFilter !== 'all' || statusFilter !== 'all') && (
              <span className="ml-1 bg-blue-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                {(categoryFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
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
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{products.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {products.filter((p) => p.status === 'active').length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">With Variants</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {products.filter((p) => p.variants && p.variants.length > 0).length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Filtered Results</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{filteredProducts.length}</p>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">{null}</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Variants / Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const hasVariants = product.variants && product.variants.length > 0;
                const isExpanded = expandedProducts.has(product.id);
                const isLoadingInv = loadingInventory.has(product.id);

                return (
                  <React.Fragment key={product.id}>
                    {/* Main Product Row */}
                    <TableRow
                      className={hasVariants ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                      onClick={() => hasVariants && toggleExpand(product.id, product.variants || [])}
                    >
                      <TableCell className="w-10">
                        {hasVariants && (
                          <button
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(product.id, product.variants || []);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductThumbnail src={product.images?.[0]} alt={product.name} />
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{product.sku}</span>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {hasVariants ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {product.variants!.length} variant{product.variants!.length !== 1 ? 's' : ''}
                            </span>
                            {isExpanded && hasInventoryLoaded(product.variants!) && (
                              <span className="text-xs text-gray-500">(Total: {getTotalStock(product.variants!)})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No variants</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(product.status)}>{product.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Edit product"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          {product.status === 'inactive' ? (
                            <button
                              onClick={() => handleReactivateProduct(product)}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                              title="Reactivate product"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteProduct(product)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              title="Delete product"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Variant Rows */}
                    {isExpanded && hasVariants && (
                      <>
                        {isLoadingInv ? (
                          <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                            <TableCell colSpan={8} className="py-4">
                              <div className="flex items-center justify-center gap-2 text-gray-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                Loading inventory...
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          product.variants!.map((variant, index) => {
                            const inv = inventoryCache[variant.sku];
                            const stock = inv?.quantityAvailable || 0;
                            const reserved = inv?.quantityReserved || 0;

                            return (
                              <TableRow
                                key={`${product.id}-variant-${index}`}
                                className="bg-gray-50 dark:bg-gray-800/50 border-l-4 border-l-blue-200 dark:border-l-blue-800"
                              >
                                <TableCell>{null}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3 pl-4">
                                    <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                                      VAR
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {formatVariantLabel(variant)}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                                    {variant.sku}
                                  </span>
                                </TableCell>
                                <TableCell>—</TableCell>
                                <TableCell>—</TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <StockBadge quantity={stock} />
                                    {reserved > 0 && (
                                      <span className="text-xs text-orange-600 dark:text-orange-400">
                                        {reserved} reserved
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className={`text-xs ${stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {stock > 0 ? 'Available' : 'Unavailable'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <a
                                    href={`/inventory?sku=${encodeURIComponent(variant.sku)}`}
                                    className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Manage Stock
                                  </a>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Product"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter product name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SKU *</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="SKU-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Electronics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Brand name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleCreateProductSubmit} className="btn btn-primary">
              Create Product
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Product" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleSaveProduct} className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Product" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleConfirmDelete} className="btn bg-red-600 hover:bg-red-700 text-white">
              Delete Product
            </button>
          </div>
        </div>
      </Modal>

      {/* Reactivate Confirmation Modal */}
      <Modal isOpen={isReactivateModalOpen} onClose={() => setIsReactivateModalOpen(false)} title="Reactivate Product" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to reactivate <strong>{selectedProduct?.name}</strong>? This will make the product visible to customers again.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setIsReactivateModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleConfirmReactivate} className="btn bg-green-600 hover:bg-green-700 text-white">
              Reactivate Product
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsPage;
