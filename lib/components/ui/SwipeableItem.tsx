'use client';

import React, { useState, useRef, useCallback } from 'react';
import { clsx } from 'clsx';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'error' | 'warning';
  onAction: () => void;
}

interface SwipeableItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function SwipeableItem({
  children,
  leftActions = [],
  rightActions = [],
  disabled = false,
  threshold = 80,
  className
}: SwipeableItemProps) {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const colorClasses = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-secondary)]',
    success: 'bg-[var(--color-success)] text-white',
    error: 'bg-[var(--color-error)] text-white',
    warning: 'bg-[var(--color-warning)] text-white'
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping || disabled) return;
    
    currentX.current = e.touches[0].clientX;
    const distance = currentX.current - startX.current;
    
    // Limit swipe distance based on available actions
    const maxLeft = leftActions.length > 0 ? threshold * leftActions.length : 0;
    const maxRight = rightActions.length > 0 ? threshold * rightActions.length : 0;
    
    const clampedDistance = Math.max(-maxRight, Math.min(maxLeft, distance));
    setSwipeDistance(clampedDistance);
  }, [isSwiping, disabled, threshold, leftActions.length, rightActions.length]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping || disabled) return;
    
    setIsSwiping(false);
    
    // Check if swipe distance exceeds threshold for any action
    const absDistance = Math.abs(swipeDistance);
    
    if (absDistance >= threshold) {
      const actionIndex = Math.floor(absDistance / threshold) - 1;
      
      if (swipeDistance > 0 && leftActions[actionIndex]) {
        leftActions[actionIndex].onAction();
      } else if (swipeDistance < 0 && rightActions[actionIndex]) {
        rightActions[actionIndex].onAction();
      }
    }
    
    // Reset swipe distance
    setSwipeDistance(0);
  }, [isSwiping, disabled, swipeDistance, threshold, leftActions, rightActions]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    startX.current = e.clientX;
    setIsSwiping(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isSwiping || disabled) return;
      
      currentX.current = e.clientX;
      const distance = currentX.current - startX.current;
      
      const maxLeft = leftActions.length > 0 ? threshold * leftActions.length : 0;
      const maxRight = rightActions.length > 0 ? threshold * rightActions.length : 0;
      
      const clampedDistance = Math.max(-maxRight, Math.min(maxLeft, distance));
      setSwipeDistance(clampedDistance);
    };
    
    const handleMouseUp = () => {
      setIsSwiping(false);
      
      const absDistance = Math.abs(swipeDistance);
      
      if (absDistance >= threshold) {
        const actionIndex = Math.floor(absDistance / threshold) - 1;
        
        if (swipeDistance > 0 && leftActions[actionIndex]) {
          leftActions[actionIndex].onAction();
        } else if (swipeDistance < 0 && rightActions[actionIndex]) {
          rightActions[actionIndex].onAction();
        }
      }
      
      setSwipeDistance(0);
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, isSwiping, swipeDistance, threshold, leftActions, rightActions]);

  return (
    <div className={clsx('relative overflow-hidden', className)}>
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 flex"
          style={{
            width: `${threshold * leftActions.length}px`,
            transform: `translateX(${Math.min(0, swipeDistance - threshold * leftActions.length)}px)`
          }}
        >
          {leftActions.map((action, index) => (
            <button
              key={action.id}
              className={clsx(
                'flex items-center justify-center transition-all duration-200',
                colorClasses[action.color],
                'hover:opacity-90 active:scale-95'
              )}
              style={{ width: `${threshold}px` }}
              onClick={action.onAction}
            >
              <div className="flex flex-col items-center space-y-1">
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <div
          className="absolute right-0 top-0 bottom-0 flex"
          style={{
            width: `${threshold * rightActions.length}px`,
            transform: `translateX(${Math.max(0, swipeDistance + threshold * rightActions.length)}px)`
          }}
        >
          {rightActions.map((action, index) => (
            <button
              key={action.id}
              className={clsx(
                'flex items-center justify-center transition-all duration-200',
                colorClasses[action.color],
                'hover:opacity-90 active:scale-95'
              )}
              style={{ width: `${threshold}px` }}
              onClick={action.onAction}
            >
              <div className="flex flex-col items-center space-y-1">
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div
        ref={itemRef}
        className={clsx(
          'relative bg-[var(--color-background)] transition-transform duration-200 swipeable',
          isSwiping ? 'duration-0' : 'duration-200'
        )}
        style={{
          transform: `translateX(${swipeDistance}px)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
}