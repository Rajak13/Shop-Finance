'use client';

import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: boolean;
}

export function Skeleton({
  className,
  width,
  height,
  variant = 'text',
  animation = true
}: SkeletonProps) {
  const baseClasses = 'bg-[var(--color-surface)]';
  const animationClasses = animation ? 'skeleton' : '';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full'
  };
  
  const defaultSizes = {
    text: { width: '100%', height: '1rem' },
    rectangular: { width: '100%', height: '2rem' },
    circular: { width: '2rem', height: '2rem' }
  };
  
  const style = {
    width: width || defaultSizes[variant].width,
    height: height || defaultSizes[variant].height
  };
  
  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        animationClasses,
        className
      )}
      style={style}
    />
  );
}

interface SkeletonGroupProps {
  children: React.ReactNode;
  loading: boolean;
  className?: string;
}

export function SkeletonGroup({ children, loading, className }: SkeletonGroupProps) {
  if (loading) {
    return <div className={className}>{children}</div>;
  }
  
  return null;
}

// Pre-built skeleton components for common use cases
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height="1.5rem" />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="2rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 border border-[var(--color-border)] rounded-lg space-y-3">
      <Skeleton height="1.5rem" width="60%" />
      <Skeleton height="1rem" />
      <Skeleton height="1rem" width="80%" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton height="1rem" width="40%" />
        <Skeleton height="2rem" width="80px" variant="rectangular" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton height="1rem" width="25%" />
        <Skeleton height="2.5rem" variant="rectangular" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton height="1rem" width="30%" />
          <Skeleton height="2.5rem" variant="rectangular" />
        </div>
        <div className="space-y-2">
          <Skeleton height="1rem" width="25%" />
          <Skeleton height="2.5rem" variant="rectangular" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton height="1rem" width="20%" />
        <Skeleton height="4rem" variant="rectangular" />
      </div>
      <div className="flex justify-end space-x-2">
        <Skeleton height="2.5rem" width="80px" variant="rectangular" />
        <Skeleton height="2.5rem" width="120px" variant="rectangular" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton height="2rem" width="200px" />
        <Skeleton height="2.5rem" width="120px" variant="rectangular" />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={`stat-${i}`} />
        ))}
      </div>
      
      {/* Chart skeleton */}
      <div className="p-6 border border-[var(--color-border)] rounded-lg">
        <Skeleton height="1.5rem" width="150px" className="mb-4" />
        <Skeleton height="300px" variant="rectangular" />
      </div>
    </div>
  );
}