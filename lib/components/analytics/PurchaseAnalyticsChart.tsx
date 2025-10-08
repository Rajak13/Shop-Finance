'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '../ui';
import { APIResponse } from '../../../types';

interface SupplierAnalytics {
  supplierName: string;
  totalPurchases: number;
  transactionCount: number;
  averageOrderValue: number;
  lastPurchaseDate: Date;
  topItems: Array<{
    itemName: string;
    totalQuantity: number;
    totalValue: number;
  }>;
}

interface PurchaseAnalyticsResponse {
  totalPurchases: number;
  supplierCount: number;
  averageOrderValue: number;
  suppliers: SupplierAnalytics[];
  topCategories: Array<{
    category: string;
    totalValue: number;
    itemCount: number;
  }>;
}

interface PurchaseAnalyticsChartProps {
  startDate?: string;
  endDate?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export default function PurchaseAnalyticsChart({ startDate, endDate }: PurchaseAnalyticsChartProps) {
  const [data, setData] = useState<PurchaseAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'suppliers' | 'categories'>('suppliers');

  useEffect(() => {
    fetchPurchaseAnalytics();
  }, [startDate, endDate]);

  const fetchPurchaseAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('limit', '10');

      const response = await fetch(`/api/analytics/purchase-analytics?${params}`);
      const result: APIResponse<PurchaseAnalyticsResponse> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch purchase analytics');
      }
    } catch (err) {
      console.error('Error fetching purchase analytics:', err);
      setError('Failed to load purchase analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('NPR', 'Rs.');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Total: {formatCurrency(payload[0].value)}
          </p>
          {payload[0].payload.transactionCount && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {payload[0].payload.transactionCount} transactions
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {data.payload.category}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Value: {formatCurrency(data.value)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {data.payload.itemCount} items
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center">
        <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
        <button
          onClick={fetchPurchaseAnalytics}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Purchases</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.totalPurchases)}
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Suppliers</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {data.supplierCount}
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg. Order Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(data.averageOrderValue)}
          </p>
        </div>
      </div>

      {/* View selector */}
      <div className="flex gap-2">
        <Button
          variant={view === 'suppliers' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setView('suppliers')}
        >
          Top Suppliers
        </Button>
        <Button
          variant={view === 'categories' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setView('categories')}
        >
          Categories
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main chart */}
        <div className="h-80">
          {view === 'suppliers' ? (
            data.suppliers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.suppliers} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="supplierName" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    className="text-xs"
                  />
                  <YAxis 
                    tickFormatter={(value) => `Rs.${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="totalPurchases" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>No supplier data available</p>
              </div>
            )
          ) : (
            data.topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.topCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }: any) => `${category} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalValue"
                  >
                    {data.topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>No category data available</p>
              </div>
            )
          )}
        </div>

        {/* Details panel */}
        <div className="space-y-4">
          {view === 'suppliers' ? (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Supplier Details
              </h4>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {data.suppliers.slice(0, 5).map((supplier, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {supplier.supplierName}
                      </h5>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(supplier.totalPurchases)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>{supplier.transactionCount} transactions</p>
                      <p>Avg: {formatCurrency(supplier.averageOrderValue)}</p>
                      <p>Last: {new Date(supplier.lastPurchaseDate).toLocaleDateString()}</p>
                    </div>
                    {supplier.topItems.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Top Items:
                        </p>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {supplier.topItems.slice(0, 3).map((item, i) => (
                            <span key={i}>
                              {item.itemName} ({item.totalQuantity})
                              {i < Math.min(2, supplier.topItems.length - 1) && ', '}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Category Breakdown
              </h4>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {data.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {category.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(category.totalValue)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {category.itemCount} items
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}