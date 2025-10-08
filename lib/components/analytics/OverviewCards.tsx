'use client';

import { useState, useEffect } from 'react';
import { Card } from '../ui';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, BarChart3 } from 'lucide-react';
import { OverviewAnalytics, APIResponse } from '../../../types';

interface OverviewCardsProps {
  startDate?: string;
  endDate?: string;
}

interface KPICard {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function OverviewCards({ startDate, endDate }: OverviewCardsProps) {
  const [analytics, setAnalytics] = useState<OverviewAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverviewData();
  }, [startDate, endDate]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/analytics/overview?${params}`);
      const data: APIResponse<OverviewAnalytics> = await response.json();

      if (data.success && data.data) {
        setAnalytics(data.data);
      } else {
        setError(data.error?.message || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('Error fetching overview analytics:', err);
      setError('Failed to load analytics data');
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
          onClick={fetchOverviewData}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Try again
        </button>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const profitMargin = analytics.totalSales > 0 
    ? ((analytics.profit / analytics.totalSales) * 100)
    : 0;

  const kpiCards: KPICard[] = [
    {
      title: 'Total Sales',
      value: formatCurrency(analytics.totalSales),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Total Purchases',
      value: formatCurrency(analytics.totalPurchases),
      icon: ShoppingCart,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Profit',
      value: formatCurrency(analytics.profit),
      trend: analytics.profit >= 0 ? 'up' : 'down',
      icon: analytics.profit >= 0 ? TrendingUp : TrendingDown,
      color: analytics.profit >= 0 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-red-600 dark:text-red-400'
    },
    {
      title: 'Transactions',
      value: formatNumber(analytics.transactionCount),
      icon: BarChart3,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Inventory Value',
      value: formatCurrency(analytics.inventoryValue),
      icon: Package,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {kpiCards.map((card, index) => (
        <Card key={index} className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              {card.title === 'Profit' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {profitMargin.toFixed(1)}% margin
                </p>
              )}
            </div>
            <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
          
          {card.trend && (
            <div className="mt-4 flex items-center">
              <div className={`flex items-center text-sm ${
                card.trend === 'up' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {card.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="font-medium">
                  {card.trend === 'up' ? 'Positive' : 'Negative'}
                </span>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}