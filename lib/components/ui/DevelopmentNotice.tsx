'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

export function DevelopmentNotice() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV === 'development') {
      const dismissed = localStorage.getItem('dev-notice-dismissed');
      if (!dismissed) {
        setIsVisible(true);
      } else {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('dev-notice-dismissed', 'true');
  };

  if (!isVisible || isDismissed || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-2xl">
      <div className="bg-[var(--color-warning)] text-black px-4 py-3 rounded-lg shadow-lg border border-yellow-400">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1">Development Mode</h3>
            <p className="text-xs mb-2">
              This application is running in development mode with fallback data. 
              If you're experiencing database connection issues, the app will use 
              in-memory data that resets on page refresh.
            </p>
            <p className="text-xs">
              <strong>Demo Credentials:</strong> admin@gmail.com / shabnam123@
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleDismiss}
            className="flex-shrink-0 bg-white bg-opacity-20 hover:bg-opacity-30 border-none"
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}