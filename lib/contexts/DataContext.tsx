'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Transaction, InventoryItem, APIResponse } from '../../types';

interface DataContextType {
  // Data state
  transactions: Transaction[];
  inventoryItems: InventoryItem[];
  dashboardStats: {
    totalSales: number;
    totalPurchases: number;
    profit: number;
    transactionCount: number;
    lowStockItems: number;
  };
  
  // Loading states
  transactionsLoading: boolean;
  inventoryLoading: boolean;
  statsLoading: boolean;
  
  // Actions
  refreshTransactions: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Transaction actions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Transaction) => void;
  removeTransaction: (id: string) => void;
  
  // Inventory actions
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, item: InventoryItem) => void;
  removeInventoryItem: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    profit: 0,
    transactionCount: 0,
    lowStockItems: 0
  });
  
  // Loading states
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Refresh functions
  const refreshTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const response = await fetch('/api/transactions?page=1&limit=100&sortBy=date&sortOrder=desc');
      const data: APIResponse<{ transactions: Transaction[]; pagination: any }> = await response.json();
      
      if (data.success && data.data) {
        setTransactions(data.data.transactions);
      }
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    try {
      setInventoryLoading(true);
      const response = await fetch('/api/inventory?page=1&limit=100');
      const data: APIResponse<{ items: InventoryItem[]; pagination: any }> = await response.json();
      
      if (data.success && data.data) {
        setInventoryItems(data.data.items);
      }
    } catch (error) {
      console.error('Error refreshing inventory:', error);
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/analytics/overview');
      const data: APIResponse<any> = await response.json();
      
      if (data.success) {
        setDashboardStats({
          totalSales: data.data.totalSales || 0,
          totalPurchases: data.data.totalPurchases || 0,
          profit: (data.data.totalSales || 0) - (data.data.totalPurchases || 0),
          transactionCount: data.data.transactionCount || 0,
          lowStockItems: data.data.lowStockItems || 0
        });
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshTransactions(),
      refreshInventory(),
      refreshStats()
    ]);
  }, [refreshTransactions, refreshInventory, refreshStats]);

  // Transaction actions
  const addTransaction = useCallback((transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    // Refresh stats after adding transaction
    refreshStats();
  }, [refreshStats]);

  const updateTransaction = useCallback((id: string, transaction: Transaction) => {
    setTransactions(prev => prev.map(t => t._id.toString() === id ? transaction : t));
    // Refresh stats after updating transaction
    refreshStats();
  }, [refreshStats]);

  const removeTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t._id.toString() !== id));
    // Refresh stats after removing transaction
    refreshStats();
  }, [refreshStats]);

  // Inventory actions
  const addInventoryItem = useCallback((item: InventoryItem) => {
    setInventoryItems(prev => [item, ...prev]);
  }, []);

  const updateInventoryItem = useCallback((id: string, item: InventoryItem) => {
    setInventoryItems(prev => prev.map(i => i._id.toString() === id ? item : i));
  }, []);

  const removeInventoryItem = useCallback((id: string) => {
    setInventoryItems(prev => prev.filter(i => i._id.toString() !== id));
  }, []);

  const value: DataContextType = {
    // Data state
    transactions,
    inventoryItems,
    dashboardStats,
    
    // Loading states
    transactionsLoading,
    inventoryLoading,
    statsLoading,
    
    // Actions
    refreshTransactions,
    refreshInventory,
    refreshStats,
    refreshAll,
    
    // Transaction actions
    addTransaction,
    updateTransaction,
    removeTransaction,
    
    // Inventory actions
    addInventoryItem,
    updateInventoryItem,
    removeInventoryItem
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}