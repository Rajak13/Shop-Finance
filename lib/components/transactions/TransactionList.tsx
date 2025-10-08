'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell, 
  Pagination 
} from '../ui/Table';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Transaction, PaginatedResponse } from '../../../types';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  ShoppingCart,
  Calendar,
  DollarSign
} from 'lucide-react';
import { clsx } from 'clsx';

interface TransactionListProps {
  transactions?: Transaction[];
  loading?: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  onView: (transaction: Transaction) => void;
  refreshTrigger?: number;
}

interface FilterState {
  type: 'all' | 'purchase' | 'sale';
  startDate: string;
  endDate: string;
  search: string;
}

interface SortState {
  field: 'date' | 'totalAmount' | 'transactionId';
  direction: 'asc' | 'desc';
}

export function TransactionList({ 
  transactions: propTransactions,
  loading: propLoading = false,
  onEdit, 
  onDelete, 
  onView, 
  refreshTrigger = 0 
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; transaction: Transaction | null }>({
    show: false,
    transaction: null
  });

  // Use prop transactions if provided, otherwise fetch from API
  const usePropsData = propTransactions !== undefined;
  const displayTransactions = usePropsData ? propTransactions : transactions;
  const displayLoading = usePropsData ? propLoading : loading;

  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });

  const [sort, setSort] = useState<SortState>({
    field: 'date',
    direction: 'desc'
  });

  const limit = 10;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy: sort.field,
        sortOrder: sort.direction
      });

      if (filters.type !== 'all') {
        params.append('type', filters.type);
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (filters.search.trim()) {
        params.append('search', filters.search.trim());
      }

      const response = await fetch(`/api/transactions?${params}`);
      const data: PaginatedResponse<Transaction> = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch transactions');
      }

      setTransactions(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions when dependencies change (only if not using props)
  useEffect(() => {
    if (!usePropsData) {
      fetchTransactions();
    }
  }, [currentPage, sort, refreshTrigger, usePropsData]);

  // Reset to first page when filters change (only if not using props)
  useEffect(() => {
    if (!usePropsData) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchTransactions();
      }
    }
  }, [filters, usePropsData]);

  const handleSort = (field: SortState['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  const handleDeleteClick = (transaction: Transaction) => {
    setDeleteConfirm({ show: true, transaction });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.transaction) {
      try {
        await onDelete(deleteConfirm.transaction._id.toString());
        setDeleteConfirm({ show: false, transaction: null });
        fetchTransactions(); // Refresh the list
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toFixed(2)}`;
  };

  const getTypeIcon = (type: 'purchase' | 'sale') => {
    return type === 'purchase' ? (
      <Package size={16} className="text-[var(--color-accent-rust)]" />
    ) : (
      <ShoppingCart size={16} className="text-[var(--color-accent-gold)]" />
    );
  };

  const getTypeColor = (type: 'purchase' | 'sale') => {
    return type === 'purchase' 
      ? 'text-[var(--color-accent-rust)] bg-[var(--color-accent-rust)]/10' 
      : 'text-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10';
  };

  if (displayLoading && displayTransactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-gold)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-[var(--color-error)] mb-4">{error}</p>
          <Button onClick={fetchTransactions} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            leftIcon={<Search size={16} />}
            fullWidth
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} className="mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-[var(--color-surface)] p-4 rounded-lg border border-[var(--color-border)]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="block w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                fullWidth
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                fullWidth
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
        <span>
          Showing {displayTransactions.length} {usePropsData ? '' : `of ${totalCount}`} transactions
        </span>
        {displayLoading && (
          <span className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-accent-gold)] mr-2"></div>
            Loading...
          </span>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                sortable 
                sortDirection={sort.field === 'transactionId' ? sort.direction : null}
                onSort={() => handleSort('transactionId')}
              >
                Transaction ID
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead 
                sortable 
                sortDirection={sort.field === 'date' ? sort.direction : null}
                onSort={() => handleSort('date')}
              >
                Date
              </TableHead>
              <TableHead>Items</TableHead>
              <TableHead 
                sortable 
                sortDirection={sort.field === 'totalAmount' ? sort.direction : null}
                onSort={() => handleSort('totalAmount')}
              >
                Total Amount
              </TableHead>
              <TableHead>Supplier/Customer</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayTransactions.map((transaction) => (
              <TableRow key={transaction._id.toString()} hover>
                <TableCell>
                  <span className="font-mono text-sm">{transaction.transactionId}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(transaction.type)}
                    <span className={clsx(
                      'px-2 py-1 rounded-full text-xs font-medium capitalize',
                      getTypeColor(transaction.type)
                    )}>
                      {transaction.type}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} className="text-[var(--color-text-secondary)]" />
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{transaction.items.length} item(s)</div>
                    <div className="text-[var(--color-text-secondary)] truncate max-w-32">
                      {transaction.items.map(item => item.itemName).join(', ')}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <DollarSign size={14} className="text-[var(--color-accent-gold)]" />
                    <span className="font-medium">{formatCurrency(transaction.totalAmount)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {transaction.type === 'purchase' ? (
                      <div>
                        <div className="font-medium">{transaction.supplier?.name}</div>
                        {transaction.supplier?.contact && (
                          <div className="text-[var(--color-text-secondary)]">{transaction.supplier.contact}</div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">{transaction.customer?.name || 'Walk-in Customer'}</div>
                        {transaction.customer?.contact && (
                          <div className="text-[var(--color-text-secondary)]">{transaction.customer.contact}</div>
                        )}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(transaction)}
                      title="View Details"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(transaction)}
                      title="Edit Transaction"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleDeleteClick(transaction)}
                      title="Delete Transaction"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {displayTransactions.length === 0 && !displayLoading && (
          <div className="text-center py-12">
            <div className="text-[var(--color-text-secondary)] mb-4">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No transactions found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          </div>
        )}

        {/* Pagination - only show if not using props data */}
        {!usePropsData && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, transaction: null })}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[var(--color-text-primary)]">
            Are you sure you want to delete this transaction?
          </p>
          {deleteConfirm.transaction && (
            <div className="bg-[var(--color-surface)] p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div><strong>ID:</strong> {deleteConfirm.transaction.transactionId}</div>
                <div><strong>Type:</strong> {deleteConfirm.transaction.type}</div>
                <div><strong>Amount:</strong> {formatCurrency(deleteConfirm.transaction.totalAmount)}</div>
                <div><strong>Date:</strong> {formatDate(deleteConfirm.transaction.date)}</div>
              </div>
            </div>
          )}
          <p className="text-sm text-[var(--color-error)]">
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm({ show: false, transaction: null })}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleDeleteConfirm}
            >
              Delete Transaction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}