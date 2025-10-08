'use client';

import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  className
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [isPulling, disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [isPulling, disabled, pullDistance, threshold, isRefreshing, onRefresh]);

  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={clsx('relative overflow-auto mobile-scroll', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: isPulling || isRefreshing ? `translateY(${Math.min(pullDistance, threshold)}px)` : 'none',
        transition: isPulling ? 'none' : 'transform 0.3s ease'
      }}
    >
      {/* Pull to refresh indicator */}
      <div
        className={clsx(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'bg-[var(--color-surface)] border-b border-[var(--color-border)]',
          'transition-all duration-300 z-10',
          isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: `${Math.min(pullDistance, threshold)}px`,
          transform: `translateY(-${Math.min(pullDistance, threshold)}px)`
        }}
      >
        <div className="flex items-center space-x-2 text-[var(--color-text-secondary)]">
          <RefreshCw
            size={20}
            className={clsx(
              'transition-all duration-300',
              isRefreshing ? 'animate-spin' : '',
              shouldTrigger ? 'text-[var(--color-accent-gold)] scale-110' : ''
            )}
            style={{
              transform: `rotate(${refreshProgress * 180}deg)`
            }}
          />
          <span className="text-sm font-medium">
            {isRefreshing 
              ? 'Refreshing...' 
              : shouldTrigger 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}