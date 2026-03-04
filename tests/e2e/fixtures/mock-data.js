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
    totalUsers: 150,
    totalProducts: 45,
    totalOrders: 320,
    totalRevenue: 28750.5,
    recentOrders: [],
    ordersByStatus: { Pending: 12, Confirmed: 8, Shipped: 15, Delivered: 285 },
  },
};

// ---------------------------------------------------------------------------
// Orders (admin)
// ---------------------------------------------------------------------------

export const mockAdminOrders = {
  success: true,
  data: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

// ---------------------------------------------------------------------------
// Reviews (admin)
// ---------------------------------------------------------------------------

export const mockAdminReviews = {
  success: true,
  data: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};
