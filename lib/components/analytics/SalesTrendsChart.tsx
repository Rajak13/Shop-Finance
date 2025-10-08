'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../ui';
import { ChartData, APIResponse } from '../../../types';

interface SalesTrendsChartProps {
  startDate?: string;
  endDate?: string;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function SalesTrendsChart({ startDate, endDate }: SalesTrendsChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('daily');

  useEffect(() => {
    fetchSalesTrends();
  }, [startDate, endDate, period]);

  const fetchSalesTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('period', period);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/analytics/sales-trends?${params}`);
      const result: APIResponse<ChartData[]> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch sales trends');
      }
    } catch (err) {
      console.error('Error fetching sales trends:', err);
      setError('Failed to load sales trends');
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
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {period === 'daily' ? new Date(label).toLocaleDateString() : label}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Sales: {formatCurrency(payload[0].value)}
          </p>
          {data.label && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {data.label}
            </p>
          )}
        </div>
      );
    }
    return null;
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
          onClick={fetchSalesTrends}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

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
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxisLabel}
                className="text-xs"
              />
              <YAxis 
                tickFormatter={(value) => `Rs.${(value / 1000).toFixed(0)}k`}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <p className="text-lg font-medium">No sales data available</p>
              <p className="text-sm">Try adjusting the date range or period</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(data.reduce((sum, item) => sum + item.value, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(data.reduce((sum, item) => sum + item.value, 0) / data.length)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Highest</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(Math.max(...data.map(item => item.value)))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Periods</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}