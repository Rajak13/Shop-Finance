'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal, ModalFooter } from '../ui/Modal';
import { TransactionFormData, TransactionItem, Transaction } from '../../../types';
import { Plus, Trash2, Package, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  initialData?: Transaction | null;
  mode: 'create' | 'edit';
  loading?: boolean;
}

export function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  loading = false
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'purchase',
    date: new Date().toISOString().split('T')[0],
    items: [{ itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    totalAmount: 0,
    notes: '',
    supplier: { name: '', contact: '' },
    customer: { name: '', contact: '' }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        setFormData({
          type: initialData.type,
          date: new Date(initialData.date).toISOString().split('T')[0],
          items: initialData.items.map(item => ({ ...item })),
          totalAmount: initialData.totalAmount,
          notes: initialData.notes || '',
          supplier: initialData.supplier || { name: '', contact: '' },
          customer: initialData.customer || { name: '', contact: '' }
        });
      } else {
        // Reset form for create mode
        setFormData({
          type: 'purchase',
          date: new Date().toISOString().split('T')[0],
          items: [{ itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
          totalAmount: 0,
          notes: '',
          supplier: { name: '', contact: '' },
          customer: { name: '', contact: '' }
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, mode]);

  // Calculate total amount whenever items change
  useEffect(() => {
    const total = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    setFormData(prev => ({ ...prev, totalAmount: total }));
  }, [formData.items]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate transaction type specific fields
    if (formData.type === 'purchase') {
      if (!formData.supplier?.name?.trim()) {
        newErrors.supplierName = 'Supplier name is required for purchases';
      }
    }

    // Validate date
    if (!formData.date) {
      newErrors.date = 'Transaction date is required';
    }

    // Validate items
    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    } else {
      formData.items.forEach((item, index) => {
        if (!item.itemName.trim()) {
          newErrors[`item_${index}_name`] = 'Item name is required';
        }
        if (item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
        }
        if (item.unitPrice < 0) {
          newErrors[`item_${index}_price`] = 'Unit price cannot be negative';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting transaction:', error);
    }
  };

  const handleTypeChange = (type: 'purchase' | 'sale') => {
    setFormData(prev => ({ ...prev, type }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.supplierName;
      return newErrors;
    });
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate total price for the item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
    
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`item_${index}_${field === 'itemName' ? 'name' : field === 'unitPrice' ? 'price' : field}`];
      return newErrors;
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
      
      // Clear errors for removed item
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`item_${index}_name`];
        delete newErrors[`item_${index}_quantity`];
        delete newErrors[`item_${index}_price`];
        return newErrors;
      });
    }
  };

  const title = mode === 'create' ? 'Add New Transaction' : 'Edit Transaction';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      className="max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Transaction Type
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleTypeChange('purchase')}
              className={clsx(
                'flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors',
                formData.type === 'purchase'
                  ? 'bg-[var(--color-accent-rust)] text-white border-[var(--color-accent-rust)]'
                  : 'bg-[var(--color-background)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-surface)]'
              )}
            >
              <Package size={16} />
              <span>Purchase</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('sale')}
              className={clsx(
                'flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors',
                formData.type === 'sale'
                  ? 'bg-[var(--color-accent-gold)] text-white border-[var(--color-accent-gold)]'
                  : 'bg-[var(--color-background)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-surface)]'
              )}
            >
              <ShoppingCart size={16} />
              <span>Sale</span>
            </button>
          </div>
        </div>

        {/* Date */}
        <Input
          label="Transaction Date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          error={errors.date}
          fullWidth
          required
        />

        {/* Supplier/Customer Information */}
        {formData.type === 'purchase' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Supplier Information</h3>
            <div className="mobile-form-grid">
              <Input
                label="Supplier Name"
                value={formData.supplier?.name || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  supplier: { 
                    name: e.target.value, 
                    contact: prev.supplier?.contact || '' 
                  }
                }))}
                error={errors.supplierName}
                fullWidth
                required
              />
              <Input
                label="Contact (Optional)"
                value={formData.supplier?.contact || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  supplier: { 
                    name: prev.supplier?.name || '', 
                    contact: e.target.value 
                  }
                }))}
                fullWidth
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Customer Information (Optional)</h3>
            <div className="mobile-form-grid">
              <Input
                label="Customer Name"
                value={formData.customer?.name || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customer: { 
                    name: e.target.value, 
                    contact: prev.customer?.contact || '' 
                  }
                }))}
                fullWidth
              />
              <Input
                label="Contact"
                value={formData.customer?.contact || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  customer: { 
                    name: prev.customer?.name || '', 
                    contact: e.target.value 
                  }
                }))}
                fullWidth
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
            >
              <Plus size={16} className="mr-1" />
              Add Item
            </Button>
          </div>
          
          {errors.items && (
            <p className="text-sm text-[var(--color-error)]">{errors.items}</p>
          )}

          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="p-4 border border-[var(--color-border)] rounded-lg space-y-4">
                {/* Mobile-first layout for item fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Item Name"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                      error={errors[`item_${index}_name`]}
                      fullWidth
                      required
                    />
                  </div>
                  <Input
                    label="Quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    error={errors[`item_${index}_quantity`]}
                    fullWidth
                    required
                  />
                  <Input
                    label="Unit Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    error={errors[`item_${index}_price`]}
                    fullWidth
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Category (Optional)"
                    value={item.category || ''}
                    onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="Total"
                    type="number"
                    value={item.totalPrice.toFixed(2)}
                    readOnly
                    fullWidth
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="error"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={formData.items.length === 1}
                  >
                    <Trash2 size={16} className="mr-1" />
                    Remove Item
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-[var(--color-surface)] p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-[var(--color-text-primary)]">Total Amount:</span>
            <span className="text-xl font-bold text-[var(--color-accent-gold)]">
              NPR {formData.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="block w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] bg-[var(--color-background)] placeholder-[var(--color-text-secondary)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)] focus:border-transparent resize-none"
            placeholder="Add any additional notes about this transaction..."
          />
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={formData.type === 'purchase' ? 'accent-rust' : 'accent-gold'}
            loading={loading}
          >
            {mode === 'create' ? 'Create Transaction' : 'Update Transaction'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}