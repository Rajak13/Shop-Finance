'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { InventoryItem } from '../../../types';
import { Package, Save, Trash2, X, AlertTriangle } from 'lucide-react';

interface InventoryItemModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (data: Partial<InventoryItem>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

interface FormData {
  itemName: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  unitPrice: number;
}

interface FormErrors {
  itemName?: string;
  category?: string;
  currentStock?: string;
  minStockLevel?: string;
  unitPrice?: string;
}

export function InventoryItemModal({ item, onClose, onSave, onDelete }: InventoryItemModalProps) {
  const [formData, setFormData] = useState<FormData>({
    itemName: '',
    category: '',
    currentStock: 0,
    minStockLevel: 5,
    unitPrice: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!item;

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        itemName: item.itemName,
        category: item.category,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
        unitPrice: item.unitPrice,
      });
    } else {
      setFormData({
        itemName: '',
        category: '',
        currentStock: 0,
        minStockLevel: 5,
        unitPrice: 0,
      });
    }
    setErrors({});
  }, [item]);

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    } else if (formData.itemName.length > 200) {
      newErrors.itemName = 'Item name cannot exceed 200 characters';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    } else if (formData.category.length > 100) {
      newErrors.category = 'Category cannot exceed 100 characters';
    }

    if (formData.currentStock < 0) {
      newErrors.currentStock = 'Current stock cannot be negative';
    }

    if (formData.minStockLevel < 0) {
      newErrors.minStockLevel = 'Minimum stock level cannot be negative';
    }

    if (formData.unitPrice < 0) {
      newErrors.unitPrice = 'Unit price cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave({
        itemName: formData.itemName.trim(),
        category: formData.category.trim(),
        currentStock: formData.currentStock,
        minStockLevel: formData.minStockLevel,
        unitPrice: formData.unitPrice,
      });
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setLoading(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Calculate total value
  const totalValue = formData.currentStock * formData.unitPrice;

  // Check if item will be low stock
  const willBeLowStock = formData.currentStock <= formData.minStockLevel;

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Inventory Item' : 'Add New Item'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {isEditing ? 'Update item details and stock levels' : 'Create a new inventory item'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Item Name *
                </label>
                <Input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => handleInputChange('itemName', e.target.value)}
                  placeholder="Enter item name"
                  error={errors.itemName}
                  maxLength={200}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <Input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Enter category"
                  error={errors.category}
                  maxLength={100}
                />
              </div>
            </div>
          </Card>

          {/* Stock Information */}
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Stock Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Stock *
                </label>
                <Input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => handleInputChange('currentStock', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  error={errors.currentStock}
                />
                {willBeLowStock && formData.currentStock > 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    This will be marked as low stock
                  </p>
                )}
                {formData.currentStock === 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    This item will be out of stock
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Stock Level *
                </label>
                <Input
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
                  placeholder="5"
                  min="0"
                  error={errors.minStockLevel}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Alert when stock falls below this level
                </p>
              </div>
            </div>
          </Card>

          {/* Pricing Information */}
          <Card className="p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Pricing Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Unit Price (NPR) *
                </label>
                <Input
                  type="number"
                  value={formData.unitPrice}
                  onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  error={errors.unitPrice}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Value
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Calculated: {formData.currentStock} × {formatCurrency(formData.unitPrice)}
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Item
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : isEditing ? 'Update Item' : 'Create Item'}
              </Button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Item
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{item?.itemName}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Modal>
  );
}