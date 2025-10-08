'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { 
  Home, 
  Receipt, 
  BarChart3, 
  Package, 
  Settings,
  type LucideIcon
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
  { id: 'transactions', label: 'Transactions', icon: Receipt, path: '/transactions' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] safe-area-pb">
      <div className="flex items-center justify-around px-1 py-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.id}
              href={item.path}
              className={clsx(
                'flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-all duration-200 touch-target min-h-[60px] active:scale-95',
                isActive
                  ? 'text-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
              )}
              role="tab"
              aria-selected={isActive}
              aria-label={`Navigate to ${item.label}`}
            >
              <div className="relative">
                <Icon 
                  size={22} 
                  className={clsx(
                    'transition-all duration-200',
                    isActive ? 'scale-110' : 'scale-100'
                  )} 
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[var(--color-error)] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={clsx(
                'mt-1 truncate transition-all duration-200 text-center max-w-full',
                isActive ? 'font-semibold' : 'font-normal'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Safe area padding for devices with home indicators
export function BottomNavigationSpacer() {
  return <div className="h-20" />;
}