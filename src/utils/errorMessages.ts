/**
 * User-friendly error messages for common backend error codes
 * Maps error codes to actionable messages for administrators
 */

interface ErrorInfo {
  code: string;
  message: string;
  statusCode: number | null;
  details?: any;
}

const ERROR_MESSAGES: Record<string, string> = {
  // Authentication & Authorization
  EMAIL_NOT_VERIFIED: 'Email address not verified.',
  ACCOUNT_SUSPENDED: 'This account has been suspended.',
  INVALID_CREDENTIALS: 'Invalid credentials provided.',
  UNAUTHORIZED: 'Authentication required. Please log in again.',
  FORBIDDEN: "You don't have permission to perform this action.",
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  ADMIN_ROLE_REQUIRED: 'Administrator privileges required for this operation.',

  // User Management
  USER_NOT_FOUND: 'User not found in the system.',
  EMAIL_EXISTS: 'A user with this email already exists.',
  WEAK_PASSWORD: 'Password does not meet security requirements.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  CANNOT_MODIFY_SELF: 'You cannot modify your own role or delete your own account.',

  // Validation
  VALIDATION_ERROR: 'Validation failed. Please check the input fields.',
  INVALID_EMAIL: 'Invalid email address format.',
  INVALID_PHONE: 'Invalid phone number format.',
  REQUIRED_FIELD: 'Required field is missing.',
  INVALID_ID: 'Invalid ID format.',

  // Address Management
  ADDRESS_NOT_FOUND: 'Address not found.',
  INVALID_ADDRESS: 'Invalid address information.',
  MAX_ADDRESSES_REACHED: 'Maximum addresses limit reached (10).',

  // Payment Methods
  PAYMENT_METHOD_NOT_FOUND: 'Payment method not found.',
  INVALID_CARD: 'Invalid card details.',
  CARD_DECLINED: 'Card was declined.',

  // Order Management
  ORDER_NOT_FOUND: 'Order not found.',
  ORDER_CANNOT_BE_CANCELLED: 'Order cannot be cancelled at this stage.',
  INSUFFICIENT_STOCK: 'Insufficient stock for this operation.',

  // Product Management
  PRODUCT_NOT_FOUND: 'Product not found.',
  SKU_EXISTS: 'SKU already exists in the system.',
  INVALID_PRICE: 'Invalid price value.',

  // Pagination
  DEEP_PAGINATION_NOT_SUPPORTED: 'Deep pagination not supported. Use cursor-based pagination for large datasets.',
  INVALID_PAGE: 'Invalid page number.',

  // Network & Server Errors
  NETWORK_ERROR: 'Network connection failed. Please check your connection.',
  SERVER_ERROR: 'Internal server error occurred. Please try again.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
  DATABASE_ERROR: 'Database operation failed.',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait before trying again.',

  // Generic Fallback
  UNKNOWN_ERROR: 'An unexpected error occurred. Please contact technical support if the problem persists.',
};

/**
 * Get user-friendly error message from error code
 */
export function getErrorMessage(errorCode?: string, defaultMessage?: string): string {
  if (!errorCode) {
    return defaultMessage || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  return ERROR_MESSAGES[errorCode] || defaultMessage || ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Extract error information from API error response
 */
export function parseApiError(error: any): ErrorInfo {
  // Network error (no response from server)
  if (!error.response) {
    return {
      code: 'NETWORK_ERROR',
      message: ERROR_MESSAGES.NETWORK_ERROR,
      statusCode: null,
    };
  }

  const { status, data } = error.response;

  // Extract error code and message from backend response
  const errorCode = data?.code || data?.errorCode || data?.error?.code;
  const backendMessage = data?.message || data?.error?.message;

  // Get user-friendly message
  const userMessage = getErrorMessage(errorCode, backendMessage);

  return {
    code: errorCode || `HTTP_${status}`,
    message: userMessage,
    statusCode: status,
    details: data?.details,
  };
}

/**
 * Check if error requires re-authentication
 */
export function requiresReAuth(errorInfo: ErrorInfo): boolean {
  return errorInfo.statusCode === 401 || errorInfo.code === 'TOKEN_EXPIRED' || errorInfo.code === 'UNAUTHORIZED';
}

/**
 * Check if error is a validation error
 */
export function isValidationError(errorInfo: ErrorInfo): boolean {
  return errorInfo.statusCode === 400 || errorInfo.code?.includes('VALIDATION') || errorInfo.code?.includes('INVALID');
}

/**
 * Check if error is related to permissions
 */
export function isPermissionError(errorInfo: ErrorInfo): boolean {
  return errorInfo.statusCode === 403 || errorInfo.code === 'FORBIDDEN' || errorInfo.code === 'ADMIN_ROLE_REQUIRED';
}

export default ERROR_MESSAGES;
