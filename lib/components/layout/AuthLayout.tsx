'use client';

import React from 'react';
import { ClientThemeToggle } from '../ui/ClientThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ 
  children, 
  title = "Shabnam Collections",
  subtitle = "Transaction Management System"
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ClientThemeToggle />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, var(--color-accent-gold) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, var(--color-accent-rust) 0%, transparent 50%)`,
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent-gold)] to-[var(--color-accent-rust)] mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">SC</span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
              {title}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          </div>

          {/* Content */}
          {children}

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-[var(--color-text-secondary)]">
              © 2024 Shabnam Collections. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}