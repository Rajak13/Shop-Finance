'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { InventoryItem } from '../../../types';
import { AlertTriangle, Package, X } from 'lucide-react';

interface LowStockAlertsProps {
  items: InventoryItem[];
  onClose: () => void;
  onItemSelect: (item: InventoryItem) => void;
}

export function LowStockAlerts({ items, onClose, onItemSelect }: LowStockAlertsProps) {
  // Separate critical (out of stock) and low stock items
  const criticalItems = items.filter(item => item.currentStock === 0);
  const lowStockItems = items.filter(item => item.currentStock > 0 && item.currentStock <= item.minStockLevel);

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleItemClick = (item: InventoryItem) => {
    onItemSelect(item);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-4xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Stock Alerts
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {items.length} item{items.length !== 1 ? 's' : ''} need{items.length === 1 ? 's' : ''} attention
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {criticalItems.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400">Low Stock</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {lowStockItems.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Critical Items (Out of Stock) */}
        {criticalItems.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Out of Stock ({criticalItems.length})
            </h3>
            <div className="space-y-2">
              {criticalItems.map((item) => (
                <Card
                  key={item._id.toString()}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.itemName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                        0 units
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Min: {item.minStockLevel}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Items */}
        {lowStockItems.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock ({lowStockItems.length})
            </h3>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <Card
                  key={item._id.toString()}
                  className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.itemName}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.category} • {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                        {item.currentStock} units
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Min: {item.minStockLevel}
                      </p>
                    </div>
                  </div>
                  
                  {/* Stock Level Indicator */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-amber-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (item.currentStock / (item.minStockLevel * 2)) * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              All items are well stocked
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No items are currently low on stock or out of stock.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click on any item to view details and update stock levels
            </p>
            <Button onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}