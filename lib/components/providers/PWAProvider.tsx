'use client';

import React, { useEffect, useState } from 'react';
import { registerServiceWorker, setupInstallPrompt } from '../../utils/serviceWorker';
import { InstallPrompt } from '../ui/InstallPrompt';
import { DevelopmentNotice } from '../ui/DevelopmentNotice';

interface PWAProviderProps {
  children: React.ReactNode;
  showInstallPrompt?: boolean;
}

export function PWAProvider({ 
  children, 
  showInstallPrompt = true 
}: PWAProviderProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register service worker
    registerServiceWorker({
      onUpdate: (registration) => {
        console.log('New app version available');
        setUpdateAvailable(true);
      },
      onSuccess: (registration) => {
        console.log('App is ready for offline use');
      },
      onError: (error) => {
        console.error('Service worker registration failed:', error);
      }
    });

    // Setup install prompt
    setupInstallPrompt();
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  return (
    <>
      {children}
      
      {/* Development notice */}
      <DevelopmentNotice />
      
      {/* Install prompt */}
      {showInstallPrompt && <InstallPrompt />}
      
      {/* Update available notification */}
      {updateAvailable && (
        <div className="fixed top-16 left-4 right-4 z-50 mx-auto max-w-md">
          <div className="bg-[var(--color-accent-gold)] text-white px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">Update Available</p>
                <p className="text-xs opacity-90">A new version is ready to install</p>
              </div>
              <button
                onClick={handleUpdate}
                className="ml-3 px-3 py-1 bg-white bg-opacity-20 rounded text-xs font-medium hover:bg-opacity-30 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}