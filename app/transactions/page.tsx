'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../lib/components/ui';
import { DashboardLayout } from '../../lib/components/layout';
import { ProtectedRoute } from '../../lib/components/auth/ProtectedRoute';
import { TransactionForm, TransactionList, TransactionDetail } from '../../lib/components/transactions';
import { useData } from '../../lib/contexts/DataContext';
import { Transaction, TransactionFormData, APIResponse } from '../../types';
import { Plus, Package, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { clsx } from 'clsx';

export default function TransactionsPage() {
  const {
    transactions,
    dashboardStats,
    transactionsLoading,
    refreshTransactions,
    addTransaction,
    updateTransaction,
    removeTransaction
  } = useData();

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(false);

  const handleCreateTransaction = () => {
    setSelectedTransaction(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetail(true);
  };

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);

      const url = formMode === 'create' 
        ? '/api/transactions'
        : `/api/transactions/${selectedTransaction?._id}`;
      
      const method = formMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: APIResponse<Transaction> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save transaction');
      }

      // Update context for immediate UI update
      if (formMode === 'create') {
        addTransaction(result.data);
      } else {
        updateTransaction(selectedTransaction!._id.toString(), result.data);
      }

      setShowForm(false);
      setSelectedTransaction(null);

    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error; // Re-throw to let the form handle the error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      const result: APIResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete transaction');
      }

      // Update context for immediate UI update
      removeTransaction(transactionId);

    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedTransaction(null);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedTransaction(null);
  };

  // Load transactions on component mount
  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  return (
    <ProtectedRoute>
      <DashboardLayout title="Transactions">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                Transactions
              </h1>
              <p className="mt-2 text-[var(--color-text-secondary)]">
                Manage your purchase and sales transactions
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={handleCreateTransaction}
                variant="accent-gold"
                size="lg"
              >
                <Plus size={20} className="mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)]">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-[var(--color-accent-rust)]" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Total Purchases
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  NPR {dashboardStats.totalPurchases.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)]">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCart className="h-8 w-8 text-[var(--color-accent-gold)]" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Total Sales
                </div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  NPR {dashboardStats.totalSales.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] p-6 rounded-lg border border-[var(--color-border)]">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={clsx(
                  'h-8 w-8 flex items-center justify-center rounded-full',
                  dashboardStats.totalSales >= dashboardStats.totalPurchases 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                )}>
                  {dashboardStats.totalSales >= dashboardStats.totalPurchases ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Net Profit/Loss
                </div>
                <div className={clsx(
                  'text-2xl font-bold',
                  dashboardStats.totalSales >= dashboardStats.totalPurchases 
                    ? 'text-green-600' 
                    : 'text-red-600'
                )}>
                  NPR {dashboardStats.profit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
          <div className="p-6">
            <TransactionList
              transactions={transactions}
              loading={transactionsLoading}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onView={handleViewTransaction}
            />
          </div>
        </div>

        {/* Transaction Form Modal */}
        <TransactionForm
          isOpen={showForm}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          initialData={selectedTransaction}
          mode={formMode}
          loading={loading}
        />

        {/* Transaction Detail Modal */}
        <TransactionDetail
          isOpen={showDetail}
          onClose={handleCloseDetail}
          transaction={selectedTransaction}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}