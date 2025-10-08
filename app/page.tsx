'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout, PageHeader, Grid } from '../lib/components/layout';
import { ProtectedRoute } from '../lib/components/auth/ProtectedRoute';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '../lib/components/ui';
import { TransactionForm } from '../lib/components/transactions/TransactionForm';
import { useData } from '../lib/contexts/DataContext';
import { Plus, Search, Edit, Trash2, TrendingUp, TrendingDown, Package, ShoppingCart, Activity, RefreshCw } from 'lucide-react';
import { Transaction, TransactionFormData, APIResponse } from '../types';
import { clsx } from 'clsx';

export default function Home() {
  const {
    transactions,
    dashboardStats,
    transactionsLoading,
    statsLoading,
    refreshAll,
    addTransaction,
    removeTransaction
  } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  // Handle transaction form submission
  const handleTransactionSubmit = async (data: TransactionFormData) => {
    try {
      setFormLoading(true);

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: APIResponse<Transaction> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create transaction');
      }

      // Add transaction to context for immediate UI update
      if (result.data) {
        addTransaction(result.data);
      }
      setIsModalOpen(false);

    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  // Handle transaction deletion
  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      const result: APIResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete transaction');
      }

      // Remove transaction from context for immediate UI update
      removeTransaction(transactionId);

    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction');
    }
  };

  // Filter transactions based on search (show only first 5 for dashboard)
  const filteredTransactions = transactions
    .filter(transaction => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.type.toLowerCase().includes(searchLower) ||
        transaction.totalAmount.toString().includes(searchLower) ||
        (transaction.supplier?.name?.toLowerCase().includes(searchLower)) ||
        (transaction.customer?.name?.toLowerCase().includes(searchLower)) ||
        transaction.items.some(item => item.itemName.toLowerCase().includes(searchLower))
      );
    })
    .slice(0, 5); // Show only first 5 transactions on dashboard

  // Load data on component mount
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Dashboard">
        <PageHeader
          title="Welcome to Shabnam Collections"
          subtitle="Manage your kurti shop transactions efficiently"
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
              >
                <RefreshCw size={16} className={clsx("mr-2", refreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="accent-gold"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus size={16} className="mr-2" />
                Add Transaction
              </Button>
            </div>
          }
        />

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <Grid cols={4} gap={4} className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCart className="h-8 w-8 text-[var(--color-accent-gold)]" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Total Sales
                  </p>
                  <p className="text-2xl font-bold text-[var(--color-accent-gold)]">
                    {statsLoading ? '...' : `NPR ${dashboardStats.totalSales.toFixed(2)}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-[var(--color-accent-rust)]" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Total Purchases
                  </p>
                  <p className="text-2xl font-bold text-[var(--color-accent-rust)]">
                    {statsLoading ? '...' : `NPR ${dashboardStats.totalPurchases.toFixed(2)}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={clsx(
                    'h-8 w-8 flex items-center justify-center rounded-full',
                    dashboardStats.profit >= 0 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  )}>
                    {dashboardStats.profit >= 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Net Profit
                  </p>
                  <p className={clsx(
                    'text-2xl font-bold',
                    dashboardStats.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {statsLoading ? '...' : `NPR ${dashboardStats.profit.toFixed(2)}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-[var(--color-text-primary)]" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Transactions
                  </p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {statsLoading ? '...' : dashboardStats.transactionCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Recent Transactions</CardTitle>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search transactions..."
                  leftIcon={<Search size={16} />}
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transactionsLoading ? (
              <div className="p-8 text-center text-[var(--color-text-secondary)]">
                Loading transactions...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-secondary)]">
                {searchTerm ? 'No transactions found matching your search.' : 'No transactions yet. Create your first transaction!'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction._id.toString()}>
                      <TableCell>
                        <span className={clsx(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          transaction.type === 'sale'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        )}>
                          {transaction.type === 'sale' ? 'Sale' : 'Purchase'}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        NPR {transaction.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {transaction.type === 'sale' 
                          ? (transaction.customer?.name || 'Walk-in Customer')
                          : (transaction.supplier?.name || 'Unknown Supplier')
                        }
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          {transaction.items.length} item{transaction.items.length !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `/transactions?view=${transaction._id}`}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction._id.toString())}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Transaction Form Modal */}
        <TransactionForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleTransactionSubmit}
          mode="create"
          loading={formLoading}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}