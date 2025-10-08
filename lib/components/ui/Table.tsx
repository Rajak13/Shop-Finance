'use client';

import React from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
  responsive?: boolean;
}

export function Table({ children, className, responsive = true }: TableProps) {
  const tableClasses = 'min-w-full divide-y divide-[var(--color-border)]';
  const containerClasses = responsive ? 'mobile-table-container mobile-scroll' : '';
  
  return (
    <div className={containerClasses}>
      <table className={clsx(tableClasses, className)}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={clsx('bg-[var(--color-surface)] border-b border-[var(--color-border)]', className)}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={clsx('bg-[var(--color-surface-elevated)] divide-y divide-[var(--color-border-light)]', className)}>
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function TableRow({ children, className, onClick, hover = true }: TableRowProps) {
  const hoverClasses = hover ? 'hover:bg-[var(--color-surface)] transition-colors duration-150' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  return (
    <tr 
      className={clsx(hoverClasses, clickableClasses, className)}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export function TableHead({ 
  children, 
  className, 
  sortable = false, 
  sortDirection = null,
  onSort 
}: TableHeadProps) {
  const baseClasses = 'px-3 sm:px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider min-w-[120px]';
  const sortableClasses = sortable ? 'cursor-pointer hover:text-[var(--color-text-primary)] select-none touch-target' : '';
  
  return (
    <th 
      className={clsx(baseClasses, sortableClasses, className)}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center space-x-1">
        <span className="truncate">{children}</span>
        {sortable && (
          <div className="flex flex-col flex-shrink-0">
            <ChevronUp 
              size={12} 
              className={clsx(
                'transition-colors',
                sortDirection === 'asc' ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-secondary)]'
              )} 
            />
            <ChevronDown 
              size={12} 
              className={clsx(
                'transition-colors -mt-1',
                sortDirection === 'desc' ? 'text-[var(--color-accent-gold)]' : 'text-[var(--color-text-secondary)]'
              )} 
            />
          </div>
        )}
      </div>
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td className={clsx('px-3 sm:px-6 py-3 sm:py-4 text-sm text-[var(--color-text-primary)] min-w-[120px]', className)}>
      <div className="truncate">
        {children}
      </div>
    </td>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Show only a subset of pages for better mobile experience
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    
    if (currentPage <= 3) return pages.slice(0, 5);
    if (currentPage >= totalPages - 2) return pages.slice(-5);
    
    return pages.slice(currentPage - 3, currentPage + 2);
  };
  
  const visiblePages = getVisiblePages();
  
  return (
    <div className={clsx('flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-t border-[var(--color-border)] sm:px-6', className)}>
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-background)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-background)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[var(--color-border)] bg-[var(--color-background)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {visiblePages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={clsx(
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === currentPage
                    ? 'z-10 bg-[var(--color-accent-gold)] border-[var(--color-accent-gold)] text-white'
                    : 'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
                )}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[var(--color-border)] bg-[var(--color-background)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}