'use client';

import { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '../ui';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { APIResponse } from '../../../types';

interface ProfitLossData {
  period: string;
  sales: number;
  purchases: number;
  profit: number;
  profitMargin: number;
  transactionCount: {
    sales: number;
    purchases: number;
  };
}

interface ProfitLossResponse {
  summary: {
    totalSales: number;
    totalPurchases: number;
    totalProfit: number;
    averageProfitMargin: number;
  };
  chartData: ProfitLossData[];
  trends: {
    salesTrend: 'up' | 'down' | 'stable';
    profitTrend: 'up' | 'down' | 'stable';
    profitMarginTrend: 'up' | 'down' | 'stable';
  };
}

interface ProfitLossChartProps {
  startDate?: string;
  endDate?: string;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function ProfitLossChart({ startDate, endDate }: ProfitLossChartProps) {
  const [data, setData] = useState<ProfitLossResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');

  useEffect(() => {
    fetchProfitLossData();
  }, [startDate, endDate, period]);

  const fetchProfitLossData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/analytics/profit-loss?${params}`);
      const result: APIResponse<ProfitLossResponse> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch profit/loss data');
      }
    } catch (err) {
      console.error('Error fetching profit/loss data:', err);
      setError('Failed to load profit/loss data');
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

  const formatXAxisLabel = (value: string) => {
    if (period === 'daily') {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return value;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {period === 'daily' ? new Date(label).toLocaleDateString() : label}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-green-600 dark:text-green-400">
              Sales: {formatCurrency(data.sales)}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Purchases: {formatCurrency(data.purchases)}
            </p>
            <p className={`text-sm ${data.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              Profit: {formatCurrency(data.profit)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Margin: {data.profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-center">
        <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
        <button
          onClick={fetchProfitLossData}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex flex-wrap gap-2">
        {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
            className="capitalize"
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80">
        {data.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="period" 
                tickFormatter={formatXAxisLabel}
                className="text-xs"
              />
              <YAxis 
                yAxisId="amount"
                tickFormatter={(value) => `Rs.${(value / 1000).toFixed(0)}k`}
                className="text-xs"
              />
              <YAxis 
                yAxisId="margin"
                orientation="right"
                tickFormatter={(value) => `${value}%`}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="amount"
                dataKey="sales" 
                fill="#10b981" 
                name="Sales"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                yAxisId="amount"
                dataKey="purchases" 
                fill="#3b82f6" 
                name="Purchases"
                radius={[2, 2, 0, 0]}
              />
              <Line 
                yAxisId="margin"
                type="monotone" 
                dataKey="profitMargin" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Profit Margin (%)"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <p className="text-lg font-medium">No profit/loss data available</p>
              <p className="text-sm">Try adjusting the date range or period</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary and trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {/* Summary */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Sales:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(data.summary.totalSales)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Purchases:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(data.summary.totalPurchases)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Profit:</span>
              <span className={`text-sm font-medium ${
                data.summary.totalProfit >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(data.summary.totalProfit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Margin:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {data.summary.averageProfitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Trends */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Trends</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sales Trend:</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(data.trends.salesTrend)}
                <span className="text-sm capitalize">{data.trends.salesTrend}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Profit Trend:</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(data.trends.profitTrend)}
                <span className="text-sm capitalize">{data.trends.profitTrend}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Margin Trend:</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(data.trends.profitMarginTrend)}
                <span className="text-sm capitalize">{data.trends.profitMarginTrend}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}