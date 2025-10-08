'use client';

import { useState } from 'react';
import { Input, Button } from '../ui';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const handleApply = () => {
    onChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleReset = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const newStartDate = thirtyDaysAgo.toISOString().split('T')[0];
    const newEndDate = today.toISOString().split('T')[0];
    
    setTempStartDate(newStartDate);
    setTempEndDate(newEndDate);
    onChange(newStartDate, newEndDate);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Select date range';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    };
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[200px] justify-start"
      >
        <Calendar className="w-4 h-4" />
        <span className="flex-1 text-left">{formatDateRange()}</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-25"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Select Date Range
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  max={tempEndDate || undefined}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  min={tempStartDate || undefined}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleApply}
                  size="sm"
                  className="flex-1"
                  disabled={!tempStartDate || !tempEndDate}
                >
                  Apply
                </Button>
              </div>
            </div>

            {/* Quick presets */}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quick Select
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Last 7 days', days: 7 },
                  { label: 'Last 30 days', days: 30 },
                  { label: 'Last 90 days', days: 90 },
                  { label: 'Last 6 months', days: 180 }
                ].map(preset => (
                  <button
                    key={preset.days}
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - preset.days);
                      
                      const startStr = start.toISOString().split('T')[0];
                      const endStr = end.toISOString().split('T')[0];
                      
                      setTempStartDate(startStr);
                      setTempEndDate(endStr);
                      onChange(startStr, endStr);
                      setIsOpen(false);
                    }}
                    className="text-xs px-2 py-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}