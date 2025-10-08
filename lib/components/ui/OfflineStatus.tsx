'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { isOnline, addOnlineListener, addOfflineListener } from '../../utils/serviceWorker';

interface OfflineStatusProps {
  className?: string;
  showWhenOnline?: boolean;
  onRetry?: () => void;
}

export function OfflineStatus({ 
  className, 
  showWhenOnline = false,
  onRetry 
}: OfflineStatusProps) {
  const [online, setOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Set initial online status
    setOnline(isOnline());

    // Add event listeners
    const removeOnlineListener = addOnlineListener(() => {
      setOnline(true);
      if (showWhenOnline) {
        setShowStatus(true);
        // Hide the online status after 3 seconds
        setTimeout(() => setShowStatus(false), 3000);
      }
    });

    const removeOfflineListener = addOfflineListener(() => {
      setOnline(false);
      setShowStatus(true);
    });

    return () => {
      removeOnlineListener();
      removeOfflineListener();
    };
  }, [showWhenOnline]);

  // Don't show anything if online and showWhenOnline is false
  if (online && !showWhenOnline && !showStatus) {
    return null;
  }

  // Don't show anything if offline but showStatus is false
  if (!online && !showStatus) {
    setShowStatus(true);
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div
      className={clsx(
        'fixed top-4 left-4 right-4 z-50 mx-auto max-w-md',
        'px-4 py-3 rounded-lg shadow-lg',
        'flex items-center justify-between',
        'transition-all duration-300 transform',
        online
          ? 'bg-[var(--color-success)] text-white translate-y-0 opacity-100'
          : 'bg-[var(--color-error)] text-white translate-y-0 opacity-100',
        className
      )}
    >
      <div className="flex items-center space-x-3">
        {online ? (
          <Wifi size={20} className="flex-shrink-0" />
        ) : (
          <WifiOff size={20} className="flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {online ? 'Back online' : 'No internet connection'}
          </p>
          <p className="text-xs opacity-90">
            {online 
              ? 'All features are available' 
              : 'Some features may not work properly'
            }
          </p>
        </div>
      </div>

      {!online && (
        <button
          onClick={handleRetry}
          className="ml-3 p-2 rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
          aria-label="Retry connection"
        >
          <RefreshCw size={16} />
        </button>
      )}
    </div>
  );
}

// Hook for using online status in components
export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isOnline());

    const removeOnlineListener = addOnlineListener(() => setOnline(true));
    const removeOfflineListener = addOfflineListener(() => setOnline(false));

    return () => {
      removeOnlineListener();
      removeOfflineListener();
    };
  }, []);

  return online;
}