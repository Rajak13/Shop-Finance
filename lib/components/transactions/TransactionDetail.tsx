'use client';

import React from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Transaction } from '../../../types';
import { 
  Package, 
  ShoppingCart, 
  Calendar, 
  DollarSign, 
  User, 
  Phone, 
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import { clsx } from 'clsx';

interface TransactionDetailProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

export function TransactionDetail({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDelete
}: TransactionDetailProps) {
  if (!transaction) return null;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toFixed(2)}`;
  };

  const getTypeIcon = (type: 'purchase' | 'sale') => {
    return type === 'purchase' ? (
      <Package size={20} className="text-[var(--color-accent-rust)]" />
    ) : (
      <ShoppingCart size={20} className="text-[var(--color-accent-gold)]" />
    );
  };

  const getTypeColor = (type: 'purchase' | 'sale') => {
    return type === 'purchase' 
      ? 'text-[var(--color-accent-rust)] bg-[var(--color-accent-rust)]/10' 
      : 'text-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10';
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(transaction._id.toString());
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Details"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Information */}
        <div className="bg-[var(--color-surface)] p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getTypeIcon(transaction.type)}
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {transaction.transactionId}
                </h3>
                <span className={clsx(
                  'inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize',
                  getTypeColor(transaction.type)
                )}>
                  {transaction.type} Transaction
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[var(--color-accent-gold)]">
                {formatCurrency(transaction.totalAmount)}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                Total Amount
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-[var(--color-text-secondary)]">
            <Calendar size={16} />
            <span>{formatDate(transaction.date)}</span>
          </div>
        </div>

        {/* Supplier/Customer Information */}
        {(transaction.supplier || transaction.customer) && (
          <div className="bg-[var(--color-surface)] p-4 rounded-lg">
            <h4 className="text-md font-semibold text-[var(--color-text-primary)] mb-3">
              {transaction.type === 'purchase' ? 'Supplier Information' : 'Customer Information'}
            </h4>
            
            {transaction.type === 'purchase' && transaction.supplier ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User size={16} className="text-[var(--color-text-secondary)]" />
                  <span className="font-medium">{transaction.supplier.name}</span>
                </div>
                {transaction.supplier.contact && (
                  <div className="flex items-center space-x-2">
                    <Phone size={16} className="text-[var(--color-text-secondary)]" />
                    <span>{transaction.supplier.contact}</span>
                  </div>
                )}
              </div>
            ) : transaction.type === 'sale' && transaction.customer ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User size={16} className="text-[var(--color-text-secondary)]" />
                  <span className="font-medium">{transaction.customer.name || 'Walk-in Customer'}</span>
                </div>
                {transaction.customer.contact && (
                  <div className="flex items-center space-x-2">
                    <Phone size={16} className="text-[var(--color-text-secondary)]" />
                    <span>{transaction.customer.contact}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[var(--color-text-secondary)]">
                No {transaction.type === 'purchase' ? 'supplier' : 'customer'} information provided
              </div>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="bg-[var(--color-surface)] p-4 rounded-lg">
          <h4 className="text-md font-semibold text-[var(--color-text-primary)] mb-3">
            Items ({transaction.items.length})
          </h4>
          
          <div className="space-y-3">
            {transaction.items.map((item, index) => (
              <div 
                key={index}
                className="bg-[var(--color-background)] p-3 rounded-lg border border-[var(--color-border)]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-[var(--color-text-primary)]">
                      {item.itemName}
                    </h5>
                    {item.category && (
                      <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface)] px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[var(--color-text-primary)]">
                      {formatCurrency(item.totalPrice)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-[var(--color-text-secondary)]">
                  <div>
                    <span className="font-medium">Quantity:</span> {item.quantity}
                  </div>
                  <div>
                    <span className="font-medium">Unit Price:</span> {formatCurrency(item.unitPrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Items Summary */}
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex justify-between items-center">
              <span className="font-medium text-[var(--color-text-primary)]">
                Total ({transaction.items.length} items):
              </span>
              <span className="text-lg font-bold text-[var(--color-accent-gold)]">
                {formatCurrency(transaction.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="bg-[var(--color-surface)] p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <FileText size={16} className="text-[var(--color-text-secondary)] mt-1" />
              <div>
                <h4 className="text-md font-semibold text-[var(--color-text-primary)] mb-2">
                  Notes
                </h4>
                <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
                  {transaction.notes}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-[var(--color-surface)] p-4 rounded-lg">
          <h4 className="text-md font-semibold text-[var(--color-text-primary)] mb-3">
            Transaction Metadata
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-[var(--color-text-secondary)]">Created:</span>
              <div className="text-[var(--color-text-primary)]">
                {new Date(transaction.createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              <span className="font-medium text-[var(--color-text-secondary)]">Last Updated:</span>
              <div className="text-[var(--color-text-primary)]">
                {new Date(transaction.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button
          variant="secondary"
          onClick={onClose}
        >
          Close
        </Button>
        {onEdit && (
          <Button
            variant="outline"
            onClick={handleEdit}
          >
            <Edit size={16} className="mr-1" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="error"
            onClick={handleDelete}
          >
            <Trash2 size={16} className="mr-1" />
            Delete
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}