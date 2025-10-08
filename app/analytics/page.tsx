'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../lib/components/auth';
import { DashboardLayout } from '../../lib/components/layout';
import { Card } from '../../lib/components/ui';
import { 
  OverviewCards, 
  SalesTrendsChart, 
  ProfitLossChart, 
  PurchaseAnalyticsChart,
  InventoryInsightsCards,
  DateRangePicker,
  ReportExport
} from '../../lib/components/analytics';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: '',
    endDate: ''
  });

  const [refreshKey, setRefreshKey] = useState(0);

  // Set default date range to last 30 days
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  }, []);

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRange({ startDate: start, endDate: end });
    setRefreshKey(prev => prev + 1); // Force refresh of all components
  };

  return (
    <ProtectedRoute>
      <DashboardLayout title="Analytics">
        <div id="analytics-dashboard" className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Business insights and performance metrics
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={handleDateRangeChange}
              />
              <ReportExport
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                reportTitle="Shabnam Collections Analytics Report"
                printElementId="analytics-dashboard"
              />
            </div>
          </div>

          {/* Overview Cards */}
          <OverviewCards 
            key={`overview-${refreshKey}`}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trends */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Sales Trends
              </h2>
              <SalesTrendsChart
                key={`sales-${refreshKey}`}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </Card>

            {/* Profit/Loss Analysis */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profit/Loss Analysis
              </h2>
              <ProfitLossChart
                key={`profit-${refreshKey}`}
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
              />
            </Card>
          </div>

          {/* Purchase Analytics */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Purchase Analytics
            </h2>
            <PurchaseAnalyticsChart
              key={`purchase-${refreshKey}`}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </Card>

          {/* Inventory Insights */}
          <InventoryInsightsCards
            key={`inventory-${refreshKey}`}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}