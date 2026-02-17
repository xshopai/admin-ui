import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CubeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { inventoryApi, productsApi } from '../services/api';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

interface StockMovement {
  id: string;
  type: 'adjustment' | 'sale' | 'return' | 'damage' | 'restock';
  quantity: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modal states
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isMovementHistoryModalOpen, setIsMovementHistoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    type: 'adjustment' as 'adjustment' | 'restock' | 'damage' | 'return',
    reason: '',
  });
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Stats
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter((item) => item.status === 'low_stock').length;
  const outOfStockItems = inventory.filter((item) => item.status === 'out_of_stock').length;
  const totalValue = inventory.reduce((sum, item) => sum + item.currentStock * 50, 0); // Placeholder price

  useEffect(() => {
    fetchInventory();
  }, []);

  const filterInventory = useCallback(() => {
    let filtered = [...inventory];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Low stock filter
    if (showLowStockOnly) {
      filtered = filtered.filter((item) => item.status === 'low_stock' || item.status === 'out_of_stock');
    }

    setFilteredInventory(filtered);
  }, [inventory, searchTerm, statusFilter, showLowStockOnly]);

  useEffect(() => {
    filterInventory();
  }, [filterInventory]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch products with inventory data
      const productsResponse = await productsApi.getAll({});
      const products = Array.isArray(productsResponse.data) ? productsResponse.data : [];

      // Collect all SKUs from products (including variant SKUs)
      const skuToProductMap: Record<string, { name: string; sku: string; productId: string }> = {};

      products.forEach((product: any) => {
        const productId = product._id || product.id;
        const productName = product.name;

        // If product has variants, use variant SKUs
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          product.variants.forEach((variant: any) => {
            if (variant.sku) {
              skuToProductMap[variant.sku] = {
                name: productName,
                sku: variant.sku,
                productId,
              };
            }
          });
        } else if (product.sku) {
          // Use product SKU if no variants
          skuToProductMap[product.sku] = {
            name: productName,
            sku: product.sku,
            productId,
          };
        }
      });

      const allSkus = Object.keys(skuToProductMap);

      // Fetch real inventory data from inventory-service
      let inventoryData: Record<string, any> = {};
      if (allSkus.length > 0) {
        inventoryData = await inventoryApi.getBatch(allSkus);
      }

      // Transform to inventory items using real data
      const inventoryItems: InventoryItem[] = allSkus.map((sku) => {
        const productInfo = skuToProductMap[sku];
        const inv = inventoryData[sku];

        const currentStock = inv?.quantityAvailable ?? 0;
        const reservedStock = inv?.quantityReserved ?? 0;
        const reorderPoint = inv?.reorderPoint ?? 50;

        let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
        if (currentStock === 0) status = 'out_of_stock';
        else if (currentStock <= reorderPoint) status = 'low_stock';

        return {
          id: productInfo.productId,
          sku: sku,
          productName: productInfo.name,
          currentStock: currentStock + reservedStock,
          availableStock: currentStock,
          reservedStock: reservedStock,
          minStockLevel: 10,
          maxStockLevel: 500,
          reorderPoint: reorderPoint,
          status,
          lastUpdated: inv?.updatedAt || inv?.updated_at || new Date().toISOString(),
        };
      });

      setInventory(inventoryItems);
      setFilteredInventory(inventoryItems);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load inventory');
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockAdjustment({ quantity: 0, type: 'adjustment', reason: '' });
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async () => {
    if (!selectedItem) return;

    try {
      // In production, call actual inventory API
      // await inventoryApi.updateStock(selectedItem.id, stockAdjustment.quantity, stockAdjustment.reason);

      setIsAdjustModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const handleViewMovements = async (item: InventoryItem) => {
    setSelectedItem(item);
    setIsMovementHistoryModalOpen(true);
    setMovementsLoading(true);

    try {
      // In production, fetch actual movement history
      // const response = await inventoryApi.getMovements(item.id);
      // setMovements(response.data);

      // Mock data for now
      setMovements([
        {
          id: '1',
          type: 'restock',
          quantity: 100,
          reason: 'New shipment received',
          createdAt: new Date().toISOString(),
          createdBy: 'Admin User',
        },
        {
          id: '2',
          type: 'sale',
          quantity: -5,
          reason: 'Customer order #ORD-12345',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          createdBy: 'System',
        },
        {
          id: '3',
          type: 'adjustment',
          quantity: -2,
          reason: 'Damaged items removed',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          createdBy: 'Admin User',
        },
      ]);
    } catch (err: any) {
      console.error('Error fetching movements:', err);
    } finally {
      setMovementsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="success">In Stock</Badge>;
      case 'low_stock':
        return <Badge variant="warning">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="error">Out of Stock</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getMovementTypeIcon = (type: string) => {
    const baseClass = 'w-8 h-8 rounded-full flex items-center justify-center';
    switch (type) {
      case 'restock':
        return (
          <div className={`${baseClass} bg-green-100 dark:bg-green-900/30`}>
            <PlusIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        );
      case 'sale':
        return (
          <div className={`${baseClass} bg-blue-100 dark:bg-blue-900/30`}>
            <CubeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
        );
      case 'damage':
        return (
          <div className={`${baseClass} bg-red-100 dark:bg-red-900/30`}>
            <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
        );
      case 'return':
        return (
          <div className={`${baseClass} bg-purple-100 dark:bg-purple-900/30`}>
            <ArrowPathIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
        );
      default:
        return (
          <div className={`${baseClass} bg-gray-100 dark:bg-gray-800`}>
            <ChartBarIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
            </div>
            <CubeIcon className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{lowStockItems}</p>
            </div>
            <ExclamationTriangleIcon className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{outOfStockItems}</p>
            </div>
            <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">${totalValue.toLocaleString()}</p>
            </div>
            <ChartBarIcon className="w-10 h-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Low Stock Toggle */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showLowStockOnly
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
            Low Stock Only
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchInventory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reorder Point</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>
                    <span
                      className={`font-bold ${
                        item.status === 'out_of_stock'
                          ? 'text-red-600'
                          : item.status === 'low_stock'
                            ? 'text-orange-600'
                            : 'text-green-600'
                      }`}
                    >
                      {item.currentStock}
                    </span>
                  </TableCell>
                  <TableCell>{item.availableStock}</TableCell>
                  <TableCell>{item.reservedStock}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    {item.currentStock <= item.reorderPoint && (
                      <span className="text-orange-600 dark:text-orange-400 font-medium">≤ {item.reorderPoint}</span>
                    )}
                    {item.currentStock > item.reorderPoint && (
                      <span className="text-gray-500">{item.reorderPoint}</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(item.lastUpdated).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdjustStock(item)}
                        className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="Adjust Stock"
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleViewMovements(item)}
                        className="p-1 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                        title="View History"
                      >
                        <ChartBarIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Adjust Stock - ${selectedItem?.productName}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Stock</label>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedItem?.currentStock}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Movement Type</label>
            <select
              value={stockAdjustment.type}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="adjustment">Manual Adjustment</option>
              <option value="restock">Restock</option>
              <option value="damage">Damage/Loss</option>
              <option value="return">Customer Return</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity Change</label>
            <input
              type="number"
              value={stockAdjustment.quantity}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter positive or negative number"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              New stock will be: {(selectedItem?.currentStock || 0) + stockAdjustment.quantity}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={stockAdjustment.reason}
              onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Enter reason for stock adjustment..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAdjustment}
              disabled={!stockAdjustment.reason}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Save Adjustment
            </button>
          </div>
        </div>
      </Modal>

      {/* Movement History Modal */}
      <Modal
        isOpen={isMovementHistoryModalOpen}
        onClose={() => setIsMovementHistoryModalOpen(false)}
        title={`Stock Movement History - ${selectedItem?.productName}`}
      >
        <div className="space-y-4">
          {movementsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : movements.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No movement history available</p>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {getMovementTypeIcon(movement.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {movement.type.replace('_', ' ')}
                      </span>
                      <span className={`font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}
                        {movement.quantity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{movement.reason}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <span>{new Date(movement.createdAt).toLocaleString()}</span>
                      <span>By {movement.createdBy}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;
