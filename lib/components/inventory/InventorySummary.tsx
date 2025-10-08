'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Package, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

interface InventorySummaryData {
  overall: {
    totalValue: number;
    totalItems: number;
    totalStock: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  categories: Array<{
    _id: string;
    totalItems: number;
    totalStock: number;
    totalValue: number;
    lowStockItems: number;
  }>;
  topValueItems: Array<{
    itemName: string;
    category: string;
    currentStock: number;
    unitPrice: number;
    totalValue: number;
  }>;
  recentlyUpdated: Array<{
    itemName: string;
    category: string;
    currentStock: number;
    lastUpdated: Date;
  }>;
}

export function InventorySummary() {
  const [data, setData] = useState<InventorySummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/inventory/summary');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch inventory summary');
      }
    } catch (err) {
      setError('Failed to fetch inventory summary');
      console.error('Error fetching inventory summary:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">
          {error || 'Failed to load inventory summary'}
        </p>
      </Card>
    );
  }

  const { overall } = data;

  return (
    <div className="space-y-6 mb-6">
      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(overall.totalValue)}
              </p>
            </div>
          </div>
        </Card>

        {/* Total Items */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {overall.totalItems.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Total Stock */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Stock</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {overall.totalStock.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {/* Low Stock Items */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {overall.lowStockItems}
              </p>
              {overall.outOfStockItems > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {overall.outOfStockItems} out of stock
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Category Breakdown */}
      {data.categories.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Category Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.categories.slice(0, 6).map((category) => (
              <div
                key={category._id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {category._id}
                  </h4>
                  {category.lowStockItems > 0 && (
                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-600 text-xs rounded-full">
                      {category.lowStockItems} low
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span className="font-medium">{category.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    <span className="font-medium">{category.totalStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Value:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(category.totalValue)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Value Items */}
      {data.topValueItems.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Top Value Items
          </h3>
          <div className="space-y-2">
            {data.topValueItems.slice(0, 5).map((item, index) => (
              <div
                key={`${item.itemName}-${index}`}
                className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {item.itemName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.category} • {item.currentStock} units
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(item.totalValue)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatCurrency(item.unitPrice)}/unit
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}