/**
 * Mock data for Tier 1 (mocked-API) Playwright E2E tests — admin-ui.
 * Provides realistic BFF API responses so tests run without a backend.
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const mockAdminUser = {
  _id: 'admin-001',
  id: 'admin-001',
  email: 'admin@xshopai.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
  isEmailVerified: true,
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  lastLoginAt: new Date().toISOString(),
};

export const mockAdminLoginResponse = {
  token: 'mock-admin-jwt-token',
  refreshToken: 'mock-admin-refresh-token',
  user: mockAdminUser,
};

// ---------------------------------------------------------------------------
// Users (admin endpoint)
// ---------------------------------------------------------------------------

export const mockUserList = {
  success: true,
  data: [
    {
      _id: 'user-001',
      id: 'user-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      roles: ['customer'],
      isActive: true,
      isEmailVerified: true,
      createdAt: '2024-06-01T00:00:00.000Z',
    },
    {
      _id: 'user-002',
      id: 'user-002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      roles: ['customer'],
      isActive: true,
      isEmailVerified: true,
      createdAt: '2024-07-15T00:00:00.000Z',
    },
    {
      _id: 'user-003',
      id: 'user-003',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob@example.com',
      roles: ['customer'],
      isActive: false,
      isEmailVerified: false,
      createdAt: '2024-08-20T00:00:00.000Z',
    },
    {
      _id: 'admin-001',
      id: 'admin-001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@xshopai.com',
      roles: ['admin'],
      isActive: true,
      isEmailVerified: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  pagination: { page: 1, limit: 20, total: 4, totalPages: 1 },
};

export const mockSingleUser = {
  success: true,
  data: {
    _id: 'user-001',
    id: 'user-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    roles: ['customer'],
    isActive: true,
    isEmailVerified: true,
    phoneNumber: '+1 (555) 123-4567',
    createdAt: '2024-06-01T00:00:00.000Z',
  },
};

// ---------------------------------------------------------------------------
// Products (admin endpoint)
// ---------------------------------------------------------------------------

export const mockAdminProductList = {
  success: true,
  data: [
    {
      _id: 'prod-001',
      id: 'prod-001',
      name: 'Wireless Bluetooth Headphones',
      description: 'Premium noise-canceling headphones',
      price: 79.99,
      sku: 'WBH-001',
      category: 'Electronics',
      status: 'active',
      stock: 50,
      images: ['https://placehold.co/400x400?text=Headphones'],
      createdAt: '2024-05-01T00:00:00.000Z',
    },
    {
      _id: 'prod-002',
      id: 'prod-002',
      name: 'Premium Cotton T-Shirt',
      description: 'Comfortable cotton t-shirt',
      price: 29.99,
      sku: 'PCT-001',
      category: 'Clothing',
      status: 'active',
      stock: 200,
      images: ['https://placehold.co/400x400?text=T-Shirt'],
      createdAt: '2024-06-01T00:00:00.000Z',
    },
    {
      _id: 'prod-003',
      id: 'prod-003',
      name: 'Smart Fitness Watch',
      description: 'Advanced smartwatch for fitness',
      price: 199.99,
      sku: 'SFW-001',
      category: 'Electronics',
      status: 'active',
      stock: 30,
      images: ['https://placehold.co/400x400?text=Watch'],
      createdAt: '2024-07-01T00:00:00.000Z',
    },
  ],
  pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
};

export const mockSingleProduct = {
  success: true,
  data: { ...mockAdminProductList.data[0] },
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const mockDashboardStats = {
  success: true,
  data: {
    users: {
      total: 150,
      active: 120,
      newThisMonth: 15,
      growth: 12.5,
      customers: 145,
      newCustomersThisMonth: 14,
      customerGrowth: 11.0,
    },
    orders: {
      total: 320,
      pending: 12,
      processing: 8,
      completed: 285,
      revenue: 28750.5,
      growth: 8.3,
    },
    products: {
      total: 45,
      active: 40,
      lowStock: 5,
      outOfStock: 2,
    },
    reviews: {
      total: 89,
      pending: 12,
      averageRating: 4.3,
      growth: 15.0,
    },
    recentOrders: [
      {
        id: 'order-001',
        orderNumber: 'ORD-2024-001',
        customerName: 'John Doe',
        totalAmount: 92.38,
        status: 'Confirmed',
        createdAt: '2024-08-01T10:00:00.000Z',
      },
    ],
    recentUsers: [
      {
        id: 'user-001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        createdAt: '2024-06-01T00:00:00.000Z',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Orders (admin)
// ---------------------------------------------------------------------------

export const mockAdminOrders = {
  success: true,
  data: [
    {
      id: 'order-001',
      orderNumber: 'ORD-2024-001',
      customerId: 'user-001',
      customerEmail: 'john@example.com',
      customerName: 'John Doe',
      status: 'Confirmed',
      paymentStatus: 'Captured',
      shippingStatus: 'NotShipped',
      items: [
        {
          id: 'item-001',
          productId: 'prod-001',
          productName: 'Wireless Bluetooth Headphones',
          quantity: 1,
          unitPrice: 79.99,
          totalPrice: 79.99,
        },
      ],
      subtotal: 79.99,
      taxAmount: 6.4,
      shippingCost: 5.99,
      discountAmount: 0,
      totalAmount: 92.38,
      currency: 'USD',
      shippingAddress: {
        addressLine1: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        country: 'US',
      },
      billingAddress: {
        addressLine1: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701',
        country: 'US',
      },
      createdAt: '2024-08-01T10:00:00.000Z',
      updatedAt: '2024-08-01T10:00:00.000Z',
      createdBy: 'user-001',
    },
    {
      id: 'order-002',
      orderNumber: 'ORD-2024-002',
      customerId: 'user-002',
      customerEmail: 'jane@example.com',
      customerName: 'Jane Smith',
      status: 'Shipped',
      paymentStatus: 'Captured',
      shippingStatus: 'InTransit',
      items: [
        {
          id: 'item-002',
          productId: 'prod-002',
          productName: 'Premium Cotton T-Shirt',
          quantity: 2,
          unitPrice: 29.99,
          totalPrice: 59.98,
        },
      ],
      subtotal: 59.98,
      taxAmount: 4.8,
      shippingCost: 5.99,
      discountAmount: 0,
      totalAmount: 70.77,
      currency: 'USD',
      shippingAddress: {
        addressLine1: '456 Oak Ave',
        city: 'Portland',
        state: 'OR',
        zipCode: '97201',
        country: 'US',
      },
      billingAddress: {
        addressLine1: '456 Oak Ave',
        city: 'Portland',
        state: 'OR',
        zipCode: '97201',
        country: 'US',
      },
      trackingNumber: 'TRK-123456',
      carrierName: 'USPS',
      createdAt: '2024-08-05T14:30:00.000Z',
      updatedAt: '2024-08-06T09:00:00.000Z',
      createdBy: 'user-002',
    },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

export const mockSingleOrder = {
  success: true,
  data: { ...mockAdminOrders.data[0] },
};

// ---------------------------------------------------------------------------
// Reviews (admin)
// ---------------------------------------------------------------------------

export const mockAdminReviews = {
  success: true,
  data: [
    {
      id: 'review-001',
      productId: 'prod-001',
      product: { id: 'prod-001', name: 'Wireless Bluetooth Headphones' },
      userId: 'user-001',
      user: { id: 'user-001', firstName: 'John', lastName: 'Doe' },
      rating: 5,
      title: 'Amazing headphones!',
      comment: 'Best noise-canceling headphones I have ever used.',
      status: 'approved',
      createdAt: '2024-08-10T12:00:00.000Z',
      verified: true,
      helpfulVotes: { helpful: 12, notHelpful: 1 },
    },
    {
      id: 'review-002',
      productId: 'prod-002',
      product: { id: 'prod-002', name: 'Premium Cotton T-Shirt' },
      userId: 'user-002',
      user: { id: 'user-002', firstName: 'Jane', lastName: 'Smith' },
      rating: 4,
      title: 'Great quality',
      comment: 'Very comfortable fabric and nice fit.',
      status: 'pending',
      createdAt: '2024-08-12T15:30:00.000Z',
      verified: false,
      helpfulVotes: { helpful: 3, notHelpful: 0 },
    },
  ],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
};

export const mockReviewStats = {
  success: true,
  data: { total: 2, pending: 1, approved: 1, averageRating: 4.5 },
};

// ---------------------------------------------------------------------------
// Inventory (admin)
// ---------------------------------------------------------------------------

export const mockInventoryList = {
  success: true,
  data: [
    {
      id: 'inv-001',
      sku: 'WBH-001',
      productName: 'Wireless Bluetooth Headphones',
      currentStock: 50,
      availableStock: 45,
      reservedStock: 5,
      minStockLevel: 10,
      maxStockLevel: 200,
      reorderPoint: 20,
      status: 'in_stock',
      lastUpdated: '2024-08-01T10:00:00.000Z',
    },
    {
      id: 'inv-002',
      sku: 'PCT-001',
      productName: 'Premium Cotton T-Shirt',
      currentStock: 8,
      availableStock: 6,
      reservedStock: 2,
      minStockLevel: 15,
      maxStockLevel: 300,
      reorderPoint: 25,
      status: 'low_stock',
      lastUpdated: '2024-08-02T14:00:00.000Z',
    },
    {
      id: 'inv-003',
      sku: 'SFW-001',
      productName: 'Smart Fitness Watch',
      currentStock: 0,
      availableStock: 0,
      reservedStock: 0,
      minStockLevel: 5,
      maxStockLevel: 100,
      reorderPoint: 10,
      status: 'out_of_stock',
      lastUpdated: '2024-08-03T09:00:00.000Z',
    },
  ],
  pagination: { page: 1, limit: 20, total: 3, totalPages: 1 },
};

// ---------------------------------------------------------------------------
// Returns (admin)
// ---------------------------------------------------------------------------

export const mockAdminReturns = {
  success: true,
  data: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

export const mockReturnStats = {
  success: true,
  data: {
    Requested: 2,
    Approved: 1,
    Rejected: 0,
    ItemsReceived: 0,
    Inspecting: 0,
    Completed: 3,
    RefundProcessed: 1,
  },
};
