import { ObjectId } from 'mongoose';

// User Types
export interface User {
  _id: ObjectId;
  email: string;
  password: string; // hashed
  name: string;
  role: 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Types
export interface TransactionItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}

export interface Transaction {
  _id: ObjectId;
  type: 'purchase' | 'sale';
  transactionId: string; // auto-generated unique ID
  date: Date;
  
  // Common fields
  items: TransactionItem[];
  totalAmount: number;
  notes?: string;
  
  // Purchase specific
  supplier?: {
    name: string;
    contact?: string;
  };
  
  // Sale specific
  customer?: {
    name?: string;
    contact?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Inventory Types
export interface InventoryItem {
  _id: ObjectId;
  itemName: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unitPrice: number;
  totalValue: number;
  lastUpdated: Date;
  createdAt: Date;
}

// Analytics Types
export interface DailySummary {
  _id: ObjectId;
  date: Date;
  totalSales: number;
  totalPurchases: number;
  transactionCount: number;
  profit: number;
  topSellingItems: string[];
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse extends APIResponse {
  user?: Record<string, unknown>;
  token?: string;
}

// Analytics Response Types
export interface OverviewAnalytics {
  totalSales: number;
  totalPurchases: number;
  profit: number;
  transactionCount: number;
  inventoryValue: number;
}

export interface SalesTrendsResponse extends APIResponse {
  data?: ChartData[];
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface InventoryInsights {
  bestSelling: Array<{
    itemName: string;
    totalSold: number;
    revenue: number;
  }>;
  slowMoving: Array<{
    itemName: string;
    currentStock: number;
    lastSaleDate?: Date;
  }>;
  lowStock: Array<{
    itemName: string;
    currentStock: number;
    minStockLevel: number;
  }>;
}

// Form Types
export interface TransactionFormData {
  type: 'purchase' | 'sale';
  date: string;
  items: TransactionItem[];
  totalAmount: number;
  notes?: string;
  supplier?: {
    name: string;
    contact?: string;
  };
  customer?: {
    name?: string;
    contact?: string;
  };
}

// Navigation Types
export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

// Theme Types
export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}