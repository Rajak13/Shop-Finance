'use client';

// Service Worker registration and management utilities

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if (typeof window === 'undefined') {
    return;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available; please refresh
                  console.log('New content is available; please refresh.');
                  config?.onUpdate?.(registration);
                } else {
                  // Content is cached for offline use
                  console.log('Content is cached for offline use.');
                  config?.onSuccess?.(registration);
                }
              }
            });
          });
        })
        .catch((error) => {
          console.log('SW registration failed: ', error);
          config?.onError?.(new Error(`Service Worker registration failed: ${error.message}`));
        });
    });
  }
}

export function unregisterServiceWorker() {
  if (typeof window === 'undefined') {
    return;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

export async function checkForUpdates(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return false;
  }
}

export function isOnline(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  
  return navigator.onLine;
}

export function addOnlineListener(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => {
    console.log('App is back online');
    callback();
  };

  window.addEventListener('online', handleOnline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

export function addOfflineListener(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOffline = () => {
    console.log('App is offline');
    callback();
  };

  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('offline', handleOffline);
  };
}

// Background sync utilities
export function requestBackgroundSync(tag: string): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.reject(new Error('Service Worker not supported'));
  }

  return navigator.serviceWorker.ready.then((registration) => {
    if ('sync' in registration) {
      return (registration as any).sync.register(tag);
    } else {
      return Promise.reject(new Error('Background Sync not supported'));
    }
  });
}

// Install prompt utilities
let deferredPrompt: any = null;

export function setupInstallPrompt() {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    console.log('Install prompt available');
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredPrompt = null;
  });
}

export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  try {
    // Show the prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the deferredPrompt
    deferredPrompt = null;
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('Error showing install prompt:', error);
    return false;
  }
}

export function canInstall(): boolean {
  return deferredPrompt !== null;
}

// PWA detection
export function isPWA(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

export function isIOSPWA(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (window.navigator as any).standalone === true;
}