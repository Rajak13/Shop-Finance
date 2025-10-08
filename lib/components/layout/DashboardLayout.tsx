'use client';

import React, { useState } from 'react';
import { BottomNavigation, BottomNavigationSpacer } from './BottomNavigation';
import { ThemeToggle } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { PWAProvider } from '../providers/PWAProvider';
import { LogOut, User, ChevronDown } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  showThemeToggle?: boolean;
}

export function DashboardLayout({ 
  children, 
  title,
  showThemeToggle = true 
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <PWAProvider>
      <div className="min-h-screen bg-[var(--color-background)]">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 safe-area-pt">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              {title && (
                <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {title}
                </h1>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {showThemeToggle && <ThemeToggle />}
              
              {/* User Menu */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors touch-target"
                  >
                    <User size={16} />
                    <span className="hidden sm:inline">{user.name}</span>
                    <ChevronDown size={14} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      
                      {/* Menu */}
                      <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md shadow-lg z-20">
                        <div className="py-1">
                          <div className="px-4 py-2 text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                            <div className="font-medium text-[var(--color-text-primary)]">{user.name}</div>
                            <div className="text-xs">{user.email}</div>
                          </div>
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors touch-target"
                          >
                            <LogOut size={16} className="mr-2" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-20 safe-area-pl safe-area-pr">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Visible on all devices */}
        <BottomNavigation />
        
        {/* Spacer for bottom navigation */}
        <BottomNavigationSpacer />
      </div>
    </PWAProvider>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 ${className || ''}`}>
      <div className="mb-4 sm:mb-0">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[var(--color-text-secondary)]">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 2 | 4 | 6 | 8;
  className?: string;
}

export function Grid({ children, cols = 1, gap = 4, className }: GridProps) {
  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
    12: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-12'
  };
  
  const gapClasses = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8'
  };
  
  return (
    <div className={`grid ${colsClasses[cols]} ${gapClasses[gap]} ${className || ''}`}>
      {children}
    </div>
  );
}