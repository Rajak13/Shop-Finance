'use client';

import React from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, Filter, X, AlertTriangle } from 'lucide-react';

interface InventorySearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  showLowStockOnly: boolean;
  onLowStockToggle: (value: boolean) => void;
}

export function InventorySearch({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  showLowStockOnly,
  onLowStockToggle,
}: InventorySearchProps) {
  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('');
    onLowStockToggle(false);
  };

  const hasActiveFilters = searchTerm || selectedCategory || showLowStockOnly;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search items by name or category..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Low Stock Filter */}
        <Button
          variant={showLowStockOnly ? "accent-rust" : "outline"}
          size="sm"
          onClick={() => onLowStockToggle(!showLowStockOnly)}
          className={`flex items-center gap-2 ${
            showLowStockOnly 
              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
              : 'text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Low Stock Only
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 text-sm">
          {searchTerm && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full">
              Search: "{searchTerm}"
            </span>
          )}
          {selectedCategory && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
              Category: {selectedCategory}
            </span>
          )}
          {showLowStockOnly && (
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-full">
              Low Stock Only
            </span>
          )}
        </div>
      )}
    </div>
  );
}