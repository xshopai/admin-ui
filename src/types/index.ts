// Core admin types
export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  role: 'customer' | 'admin'; // Primary role for backward compatibility
  roles: ('customer' | 'admin')[]; // All roles
  status: 'active' | 'inactive' | 'suspended';
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  profileImage?: string;
  phone?: string;
  address?: string;
  addresses?: any[];
  paymentMethods?: any[];
  wishlist?: any[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  brand?: string;
  sku: string;

  // Hierarchical category taxonomy
  department?: string; // Level 1: Women, Men, Kids, Electronics, Sports, Books
  category?: string; // Level 2: Clothing, Accessories, Computers, Audio, etc.
  subcategory?: string; // Level 3: Tops, Laptops, Headphones, Running, etc.
  product_type?: string; // Level 4: T-Shirts, Gaming Laptops, etc. (for filtering only)

  // Media and metadata
  images: string[];
  tags: string[];

  // Product variations
  colors?: string[]; // Available colors: ["Red", "Blue", "Black"]
  sizes?: string[]; // Available sizes: ["S", "M", "L", "XL"]

  // Product specifications (flexible key-value pairs)
  specifications?: Record<string, string>;
  highlights?: string[];

  // Status
  status: 'active' | 'inactive' | 'draft';
  is_active?: boolean;
  stock: number;

  // Audit trail
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  orderNumber: string;
  status: 'Created' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
  paymentStatus: 'Pending' | 'Authorized' | 'Captured' | 'Failed' | 'Cancelled' | 'Refunded';
  shippingStatus: 'NotShipped' | 'Preparing' | 'Shipped' | 'InTransit' | 'Delivered' | 'Returned';
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  taxRate?: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethodId?: string;
  paymentProvider?: string;
  paymentTransactionId?: string;
  paymentReference?: string;
  shippingMethod?: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  shippedDate?: string;
  deliveredDate?: string;
  createdBy: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId?: string;
  productId: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  originalPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  taxAmount?: number;
  shippingCostPerItem?: number;
  totalPrice: number;
  isGift?: boolean;
  giftMessage?: string;
  giftWrapCost?: number;
  notes?: string;
}

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Review {
  id: string;
  productId: string;
  product?: Product;
  userId: string;
  user?: User;
  rating: number;
  title: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  helpfulVotes?: {
    helpful: number;
    notHelpful: number;
    userVotes?: Array<{
      userId: string;
      vote: 'helpful' | 'notHelpful';
      votedAt: string;
    }>;
  };
  verified?: boolean;
}

export interface InventoryItem {
  id: string;
  productId: string;
  product?: Product;
  stock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  location: string;
  lastUpdated: string;
  movements: InventoryMovement[];
}

export interface InventoryMovement {
  id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  createdAt: string;
  createdBy: string;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    revenue: number;
    growth: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  reviews: {
    total: number;
    pending: number;
    averageRating: number;
    growth: number;
  };
}

// Return types
export interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  quantityToReturn: number;
  unitPrice: number;
  refundAmount: number;
  itemCondition?: string;
}

export interface Return {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerEmail?: string;
  customerName?: string;
  returnNumber: string;
  status: 'Requested' | 'Approved' | 'Rejected' | 'ItemsReceived' | 'Inspecting' | 'Completed' | 'RefundProcessed';
  reason: string;
  description: string;
  items: ReturnItem[];
  itemsRefundAmount: number;
  shippingRefundAmount: number;
  totalRefundAmount: number;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  itemsReceivedAt?: string;
  completedAt?: string;
  processedBy?: string;
  refundProcessedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReturnStats {
  Requested?: number;
  Approved?: number;
  Rejected?: number;
  ItemsReceived?: number;
  Inspecting?: number;
  Completed?: number;
  RefundProcessed?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}
