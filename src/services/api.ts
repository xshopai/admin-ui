import axios, { AxiosInstance } from 'axios';
import { ApiResponse, PaginatedResponse } from '../types';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { parseApiError, requiresReAuth } from '../utils/errorMessages';

// Base API configuration - Route through BFF
// - For Docker: Use relative URL (nginx proxies /api to web-bff)
// - For local development: Use REACT_APP_BFF_URL or localhost:8014
const REACT_APP_BFF_URL =
  process.env.REACT_APP_BFF_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8014');

// Create axios instance for BFF API
export const bffApiClient: AxiosInstance = axios.create({
  baseURL: REACT_APP_BFF_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookie handling for BFF
});

// Legacy clients (kept for backward compatibility but will route through BFF)
export const authApiClient = bffApiClient;
export const adminApiClient = bffApiClient;

// Request interceptor for BFF API
bffApiClient.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add correlation ID for distributed tracing
    if (!config.headers['x-correlation-id']) {
      config.headers['x-correlation-id'] = uuidv4();
    }

    return config;
  },
  (error) => {
    logger.error('API Request Setup Failed', { error: error.message });
    return Promise.reject(error);
  },
);

// Response interceptor for BFF API error handling
bffApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Parse error with user-friendly messages
    const errorInfo = parseApiError(error);

    // Log meaningful error information
    logger.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      code: errorInfo.code,
      message: errorInfo.message,
      statusCode: errorInfo.statusCode,
      correlationId: error.response?.headers?.['x-correlation-id'],
    });

    // Handle 401 unauthorized - redirect to login
    if (requiresReAuth(errorInfo)) {
      logger.warn('Session expired - redirecting to login');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }

    // Enhance error with user-friendly message
    const enhancedError: any = new Error(errorInfo.message);
    enhancedError.code = errorInfo.code;
    enhancedError.statusCode = errorInfo.statusCode;
    enhancedError.details = errorInfo.details;
    enhancedError.response = error.response;

    return Promise.reject(enhancedError);
  },
);

// Auth API functions
export const authApi = {
  login: async (
    email: string,
    password: string,
  ): Promise<ApiResponse<{ user: any; token: string; refreshToken: string }>> => {
    try {
      const response = await authApiClient.post('/api/auth/login', {
        email,
        password,
      });

      // Auth service returns: { token, user: { id, email, firstName, lastName, roles, isEmailVerified, isActive, createdAt } }
      if (response.data.token && response.data.user) {
        const backendUser = response.data.user;
        const frontendUser = {
          id: backendUser._id || backendUser.id,
          firstName: backendUser.firstName,
          lastName: backendUser.lastName,
          email: backendUser.email,
          role: (backendUser.roles?.includes('admin') ? 'admin' : 'customer') as 'customer' | 'admin',
          roles: backendUser.roles || [],
          status: (backendUser.isActive !== false ? 'active' : 'inactive') as 'active' | 'inactive' | 'suspended',
          createdAt: backendUser.createdAt || new Date().toISOString(),
          lastLogin: backendUser.lastLoginAt || new Date().toISOString(),
        };

        logger.info('Login successful', { userId: frontendUser.id, role: frontendUser.role });

        return {
          success: true,
          data: {
            user: frontendUser,
            token: response.data.token,
            refreshToken: response.data.refreshToken || '', // Auth service may not return refresh token
          },
        };
      } else {
        return {
          success: false,
          data: { user: null as any, token: '', refreshToken: '' },
          message: response.data.error?.message || 'Invalid login response from server',
        };
      }
    } catch (error: any) {
      // Determine user-friendly error message
      let userMessage = 'Login failed';

      if (!error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED')) {
        userMessage = 'Cannot connect to server. Please check if the service is running.';
      } else if (error.response?.status === 502 || error.response?.status === 503) {
        userMessage = 'Backend service unavailable. The authentication service may be down.';
      } else if (error.response?.status === 401) {
        userMessage = error.response?.data?.error?.message || 'Invalid email or password';
      } else if (error.response?.data?.error?.message) {
        userMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        userMessage = error.response.data.message;
      }

      logger.authError('Login', error, { email, userMessage });

      return {
        success: false,
        data: { user: null as any, token: '', refreshToken: '' },
        message: userMessage,
      };
    }
  },

  verify: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await authApiClient.get('/api/auth/verify');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.error?.message || 'Token verification failed',
      };
    }
  },

  logout: async (): Promise<ApiResponse<null>> => {
    try {
      const refreshToken = localStorage.getItem('admin_refresh_token');
      const response = await authApiClient.post('/api/auth/logout', { refreshToken });
      return {
        success: true,
        data: null,
        message: response.data.message || 'Logged out successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.response?.data?.error?.message || 'Logout failed',
      };
    }
  },
};

// Users API functions
export const usersApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    email?: string;
    isActive?: string;
    isEmailVerified?: string;
  }) => {
    const response = await adminApiClient.get<PaginatedResponse<any>>('/api/admin/users', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await adminApiClient.get<ApiResponse<any>>(`/api/admin/users/${id}`);
    return response.data;
  },

  create: async (userData: any) => {
    const response = await adminApiClient.post<ApiResponse<any>>('/api/admin/users', userData);
    return response.data;
  },

  update: async (id: string, userData: any) => {
    const response = await adminApiClient.patch<ApiResponse<any>>(`/api/admin/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await adminApiClient.delete<ApiResponse<null>>(`/api/admin/users/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await adminApiClient.patch<ApiResponse<any>>(`/api/admin/users/${id}/status`, { status });
    return response.data;
  },

  resetPassword: async (id: string, email: string) => {
    const response = await adminApiClient.post<ApiResponse<any>>(`/api/admin/users/${id}/reset-password`, { email });
    return response.data;
  },
};

// Products API functions
export const productsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; category?: string; status?: string }) => {
    const response = await adminApiClient.get<PaginatedResponse<any>>('/api/admin/products', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await adminApiClient.get<ApiResponse<any>>(`/api/admin/products/${id}`);
    return response.data;
  },

  create: async (productData: any) => {
    const response = await adminApiClient.post<ApiResponse<any>>('/api/admin/products', productData);
    return response.data;
  },

  update: async (id: string, productData: any) => {
    const response = await adminApiClient.patch<ApiResponse<any>>(`/api/admin/products/${id}`, productData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await adminApiClient.delete<ApiResponse<null>>(`/api/admin/products/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await adminApiClient.patch<ApiResponse<any>>(`/api/admin/products/${id}/status`, { status });
    return response.data;
  },
};

// Orders API functions
export const ordersApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await adminApiClient.get<PaginatedResponse<any>>('/api/admin/orders/paged', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await adminApiClient.get<ApiResponse<any>>(`/api/admin/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string, paymentStatus?: string, shippingStatus?: string) => {
    const response = await adminApiClient.put<ApiResponse<any>>(`/api/admin/orders/${id}/status`, {
      status,
      paymentStatus,
      shippingStatus,
    });
    return response.data;
  },

  // Payment management (Admin-Driven Workflow)
  getPayment: async (orderId: string) => {
    const response = await adminApiClient.get<ApiResponse<any>>(`/api/admin/orders/${orderId}/payment`);
    return response.data;
  },

  confirmPayment: async (orderId: string) => {
    const response = await adminApiClient.post<ApiResponse<any>>(`/api/admin/orders/${orderId}/confirm-payment`);
    return response.data;
  },

  rejectPayment: async (orderId: string, reason: string) => {
    const response = await adminApiClient.post<ApiResponse<any>>(`/api/admin/orders/${orderId}/fail-payment`, {
      reason,
    });
    return response.data;
  },

  addNote: async (id: string, note: string) => {
    // TODO: Implement notes endpoint in Order Service
    console.warn('Notes endpoint not yet implemented in Order Service');
    return Promise.resolve({ success: true, data: null });
  },

  updateTracking: async (id: string, trackingNumber: string, carrierName?: string) => {
    // TODO: Implement tracking endpoint in Order Service
    // For now, update via status endpoint
    console.warn('Tracking endpoint not yet implemented in Order Service');
    return Promise.resolve({ success: true, data: null });
  },

  delete: async (id: string) => {
    const response = await adminApiClient.delete<ApiResponse<null>>(`/api/admin/orders/${id}`);
    return response.data;
  },
};

// Reviews API functions
export const reviewsApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; status?: string; rating?: number }) => {
    const response = await adminApiClient.get<PaginatedResponse<any>>('/api/admin/reviews', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await adminApiClient.get<ApiResponse<any>>(`/api/admin/reviews/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await adminApiClient.patch<ApiResponse<any>>(`/api/admin/reviews/${id}`, { status });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await adminApiClient.delete<ApiResponse<null>>(`/api/admin/reviews/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await adminApiClient.get<ApiResponse<any>>('/api/admin/reviews/stats');
    return response.data;
  },
};

// Inventory API functions
export const inventoryApi = {
  getAll: async (params?: { page?: number; limit?: number; search?: string; lowStock?: boolean }) => {
    const response = await adminApiClient.get<PaginatedResponse<any>>('/inventory', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await adminApiClient.get<ApiResponse<any>>(`/inventory/${id}`);
    return response.data;
  },

  updateStock: async (id: string, quantity: number, reason: string) => {
    const response = await adminApiClient.patch<ApiResponse<any>>(`/inventory/${id}/stock`, { quantity, reason });
    return response.data;
  },

  getMovements: async (id: string) => {
    const response = await adminApiClient.get<ApiResponse<any[]>>(`/inventory/${id}/movements`);
    return response.data;
  },
};

// Dashboard API functions
export const dashboardApi = {
  getStats: async (includeRecent: boolean = false, recentLimit: number = 10) => {
    const params = new URLSearchParams();
    if (includeRecent) {
      params.append('includeRecent', 'true');
      params.append('recentLimit', recentLimit.toString());
    }
    const url = `/api/admin/dashboard/stats${params.toString() ? '?' + params.toString() : ''}`;
    const response = await adminApiClient.get<ApiResponse<any>>(url);
    return response.data;
  },

  getRecentOrders: async (limit: number = 10) => {
    // Use the stats endpoint with includeRecent flag
    const response = await adminApiClient.get<ApiResponse<any>>(
      `/api/admin/dashboard/stats?includeRecent=true&recentLimit=${limit}`,
    );
    return (response.data as any).recentOrders || [];
  },

  getRecentUsers: async (limit: number = 10) => {
    // Use the stats endpoint with includeRecent flag
    const response = await adminApiClient.get<ApiResponse<any>>(
      `/api/admin/dashboard/stats?includeRecent=true&recentLimit=${limit}`,
    );
    return (response.data as any).recentUsers || [];
  },

  getAnalytics: async (period: string) => {
    const response = await adminApiClient.get<ApiResponse<any>>(`/api/admin/dashboard/analytics?period=${period}`);
    return response.data;
  },
};

// Returns API functions
export const returnsApi = {
  getAll: async () => {
    const response = await adminApiClient.get<ApiResponse<any[]>>('/api/admin/returns');
    return response.data;
  },

  getPaged: async (params?: { page?: number; pageSize?: number; status?: string }) => {
    const response = await adminApiClient.get<PaginatedResponse<any>>('/api/admin/returns/paged', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await adminApiClient.get<ApiResponse<any>>(`/api/admin/returns/${id}`);
    return response.data;
  },

  updateStatus: async (
    id: string,
    data: {
      status: string;
      notes?: string;
      rejectionReason?: string;
    },
  ) => {
    const response = await adminApiClient.put<ApiResponse<any>>(`/api/admin/returns/${id}/status`, data);
    return response.data;
  },

  getStats: async () => {
    const response = await adminApiClient.get<ApiResponse<any>>('/api/admin/returns/stats');
    return response.data;
  },
};
