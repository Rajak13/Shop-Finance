'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from './Button';
import { canInstall, showInstallPrompt, isPWA } from '../../utils/serviceWorker';

interface InstallPromptProps {
  className?: string;
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function InstallPrompt({ className, onInstall, onDismiss }: InstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isPWA()) {
      return;
    }

    // Check if user has previously dismissed
    const wasDismissed = localStorage.getItem('install-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check if install prompt is available
    const checkInstallability = () => {
      if (canInstall()) {
        setShowPrompt(true);
      }
    };

    // Check immediately and then periodically
    checkInstallability();
    const interval = setInterval(checkInstallability, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    try {
      const installed = await showInstallPrompt();
      if (installed) {
        setShowPrompt(false);
        onInstall?.();
      }
    } catch (error) {
      console.error('Failed to show install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('install-prompt-dismissed', 'true');
    onDismiss?.();
  };

  // Don't show if dismissed or not available
  if (!showPrompt || dismissed || isPWA()) {
    return null;
  }

  return (
    <div className={`fixed bottom-20 sm:bottom-4 left-4 right-4 z-40 ${className}`}>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg p-4 max-w-md mx-auto">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-[var(--color-accent-gold)] rounded-lg flex items-center justify-center">
              <Smartphone size={20} className="text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
              Install Shabnam Transactions
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              Add to your home screen for quick access and offline functionality
            </p>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="accent-gold"
                onClick={handleInstall}
                className="flex-1"
              >
                <Download size={14} className="mr-1" />
                Install
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDismiss}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for PWA installation status
export function useInstallStatus() {
  const [canInstallApp, setCanInstallApp] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isPWA());
    
    const checkInstallability = () => {
      setCanInstallApp(canInstall());
    };

    checkInstallability();
    const interval = setInterval(checkInstallability, 2000);

    return () => clearInterval(interval);
  }, []);

  return {
    canInstall: canInstallApp,
    isInstalled,
    install: showInstallPrompt
  };
}