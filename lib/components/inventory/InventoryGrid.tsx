'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { InventoryItem } from '../../../types';
import { Package, AlertTriangle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface InventoryGridProps {
  items: InventoryItem[];
  loading: boolean;
  onItemSelect: (item: InventoryItem) => void;
  onRefresh: () => void;
}

export function InventoryGrid({ items, loading, onItemSelect, onRefresh }: InventoryGridProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No inventory items found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Start by adding your first inventory item or adjust your search filters.
        </p>
        <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </Card>
    );
  }

  // Helper function to get stock status
  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) {
      return { status: 'out-of-stock', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' };
    } else if (item.currentStock <= item.minStockLevel) {
      return { status: 'low-stock', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/20' };
    } else {
      return { status: 'in-stock', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' };
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

  return (
    <div className="space-y-4">
      {/* Grid Header */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {items.length} item{items.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const stockStatus = getStockStatus(item);
          
          return (
            <Card
              key={item._id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onItemSelect(item)}
            >
              {/* Item Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {item.itemName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {item.category}
                  </p>
                </div>
                
                {/* Stock Status Badge */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                  {item.currentStock === 0 ? 'Out' : 
                   item.currentStock <= item.minStockLevel ? 'Low' : 'OK'}
                </div>
              </div>

              {/* Stock Information */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Stock:</span>
                  <div className="flex items-center gap-1">
                    <span className={`font-medium ${stockStatus.color}`}>
                      {item.currentStock}
                    </span>
                    {item.currentStock <= item.minStockLevel && (
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Min Level:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.minStockLevel}
                  </span>
                </div>
              </div>

              {/* Price Information */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Unit Price:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.unitPrice)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Value:</span>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(item.totalValue)}
                  </span>
                </div>
              </div>

              {/* Stock Level Indicator */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.currentStock === 0 
                      ? 'bg-red-500' 
                      : item.currentStock <= item.minStockLevel 
                        ? 'bg-amber-500' 
                        : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (item.currentStock / (item.minStockLevel * 2)) * 100)}%`
                  }}
                ></div>
              </div>

              {/* Last Updated */}
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Updated:</span>
                <span>
                  {new Date(item.lastUpdated).toLocaleDateString('en-NP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}