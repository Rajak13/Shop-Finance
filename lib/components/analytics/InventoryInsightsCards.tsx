'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui';
import { TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { InventoryInsights, APIResponse } from '../../../types';

interface InventoryInsightsCardsProps {
  startDate?: string;
  endDate?: string;
}

export default function InventoryInsightsCards({ startDate, endDate }: InventoryInsightsCardsProps) {
  const [insights, setInsights] = useState<InventoryInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventoryInsights();
  }, [startDate, endDate]);

  const fetchInventoryInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '5');

      const response = await fetch(`/api/analytics/inventory-insights?${params}`);
      const result: APIResponse<InventoryInsights> = await response.json();

      if (result.success && result.data) {
        setInsights(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch inventory insights');
      }
    } catch (err) {
      console.error('Error fetching inventory insights:', err);
      setError('Failed to load inventory insights');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('NPR', 'Rs.');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchInventoryInsights}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      </Card>
    );
  }

  if (!insights) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Best Selling Items */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Best Selling Items
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Top performers by quantity sold
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {insights.bestSelling.length > 0 ? (
            insights.bestSelling.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.itemName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.totalSold} units sold
                  </p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(item.revenue)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No sales data available
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Slow Moving Items */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Slow Moving Items
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Items with low sales activity
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {insights.slowMoving.length > 0 ? (
            insights.slowMoving.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.itemName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.currentStock} in stock
                  </p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Last sold: {formatDate(item.lastSaleDate || null)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No slow-moving items identified
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Low Stock Items */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Low Stock Alerts
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Items below minimum stock level
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {insights.lowStock.length > 0 ? (
            insights.lowStock.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.itemName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Min: {item.minStockLevel} units
                  </p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {item.currentStock} left
                  </p>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-red-600 dark:bg-red-400 h-1.5 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (item.currentStock / item.minStockLevel) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-green-600 dark:text-green-400">
                All items are well stocked!
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}