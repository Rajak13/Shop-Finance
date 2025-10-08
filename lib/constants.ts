// Authentication Constants
export const AUTH_CREDENTIALS = {
  EMAIL: 'admin@gmail.com',
  PASSWORD: 'shabnam123@',
} as const;

// Transaction Constants
export const TRANSACTION_TYPES = {
  PURCHASE: 'purchase',
  SALE: 'sale',
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Theme Constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'shabnam-theme',
  AUTH_TOKEN: 'shabnam-auth-token',
} as const;

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
  },
  TRANSACTIONS: {
    BASE: '/api/transactions',
    BY_ID: (id: string) => `/api/transactions/${id}`,
  },
  ANALYTICS: {
    OVERVIEW: '/api/analytics/overview',
    SALES_TRENDS: '/api/analytics/sales-trends',
    INVENTORY_INSIGHTS: '/api/analytics/inventory-insights',
  },
  INVENTORY: {
    BASE: '/api/inventory',
    BY_ID: (id: string) => `/api/inventory/${id}`,
  },
} as const;

// Navigation Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  ANALYTICS: '/analytics',
  INVENTORY: '/inventory',
  SETTINGS: '/settings',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  TRANSACTION_CREATED: 'Transaction created successfully',
  TRANSACTION_UPDATED: 'Transaction updated successfully',
  TRANSACTION_DELETED: 'Transaction deleted successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
} as const;

// Validation Rules
export const VALIDATION = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MESSAGE: 'Password must be at least 6 characters long',
  },
  TRANSACTION: {
    MIN_AMOUNT: 0.01,
    MAX_AMOUNT: 999999.99,
    AMOUNT_MESSAGE: 'Amount must be between 0.01 and 999,999.99',
  },
} as const;