'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../lib/components/layout';
import { ProtectedRoute } from '../../lib/components/auth/ProtectedRoute';
import { InventoryGrid } from '../../lib/components/inventory/InventoryGrid';
import { Button } from '../../lib/components/ui/Button';
import { Card } from '../../lib/components/ui/Card';
import { useData } from '../../lib/contexts/DataContext';
import { InventoryItem } from '../../types';
import { Plus, AlertTriangle, Package } from 'lucide-react';

import { InventorySearch } from '../../lib/components/inventory/InventorySearch';
import { InventorySummary } from '../../lib/components/inventory/InventorySummary';
import { InventoryItemModal } from '../../lib/components/inventory/InventoryItemModal';
import { LowStockAlerts } from '../../lib/components/inventory/LowStockAlerts';

export default function InventoryPage() {
  const {
    inventoryItems,
    inventoryLoading,
    refreshInventory,
    addInventoryItem,
    updateInventoryItem,
    removeInventoryItem
  } = useData();

  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [showLowStockAlerts, setShowLowStockAlerts] = useState(false);

  // Filter inventory items based on search and filters
  const filterItems = () => {
    let filtered = inventoryItems;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (showLowStockOnly) {
      filtered = filtered.filter(item => item.currentStock <= item.minStockLevel);
    }

    setFilteredItems(filtered);
  };

  // Fetch low stock items
  const fetchLowStockItems = async () => {
    try {
      const response = await fetch('/api/inventory/low-stock');
      const data = await response.json();

      if (data.success) {
        setLowStockItems(data.data.items);
      }
    } catch (err) {
      console.error('Error fetching low stock items:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    refreshInventory();
    fetchLowStockItems();
  }, [refreshInventory]);

  // Filter items when search/filter criteria change
  useEffect(() => {
    filterItems();
  }, [inventoryItems, searchTerm, selectedCategory, showLowStockOnly]);

  // Handle item selection
  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  // Handle item creation
  const handleCreateItem = () => {
    setSelectedItem(null);
    setShowModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Handle item save (create/update)
  const handleItemSave = async (itemData: Partial<InventoryItem>) => {
    try {
      const url = selectedItem 
        ? `/api/inventory/${selectedItem._id}`
        : '/api/inventory';
      
      const method = selectedItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      const data = await response.json();

      if (data.success) {
        if (selectedItem) {
          updateInventoryItem(selectedItem._id.toString(), data.data);
        } else {
          addInventoryItem(data.data);
        }
        await fetchLowStockItems();
        handleModalClose();
      } else {
        throw new Error(data.error?.message || 'Failed to save item');
      }
    } catch (err) {
      console.error('Error saving item:', err);
      setError(err instanceof Error ? err.message : 'Failed to save item');
    }
  };

  // Handle item delete
  const handleItemDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        removeInventoryItem(itemId);
        await fetchLowStockItems();
        handleModalClose();
      } else {
        throw new Error(data.error?.message || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(inventoryItems.map(item => item.category).filter(Boolean))).sort();

  return (
    <ProtectedRoute>
      <DashboardLayout title="Inventory">
        <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Inventory Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track and manage your stock levels
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {lowStockItems.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowLowStockAlerts(true)}
                className="flex items-center gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <AlertTriangle className="h-4 w-4" />
                {lowStockItems.length} Low Stock
              </Button>
            )}
            <Button
              onClick={handleCreateItem}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <InventorySummary />

        {/* Search and Filters */}
        <Card className="p-4 mb-6">
          <InventorySearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            showLowStockOnly={showLowStockOnly}
            onLowStockToggle={setShowLowStockOnly}
          />
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </Card>
        )}

        {/* Inventory Grid */}
        <InventoryGrid
          items={filteredItems}
          loading={inventoryLoading}
          onItemSelect={handleItemSelect}
          onRefresh={refreshInventory}
        />

        {/* Modals */}
        {showModal && (
          <InventoryItemModal
            item={selectedItem}
            onClose={handleModalClose}
            onSave={handleItemSave}
            onDelete={selectedItem ? () => handleItemDelete(selectedItem._id.toString()) : undefined}
          />
        )}

        {showLowStockAlerts && (
          <LowStockAlerts
            items={lowStockItems}
            onClose={() => setShowLowStockAlerts(false)}
            onItemSelect={handleItemSelect}
          />
        )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}