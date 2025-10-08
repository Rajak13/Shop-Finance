'use client';

import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent-gold' | 'accent-rust' | 'success' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 select-none';
  
  const variantClasses = {
    primary: 'bg-[var(--color-primary)] text-white hover:brightness-110 hover:shadow-lg focus:ring-[var(--color-primary)] shadow-md',
    secondary: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-accent-gold)] focus:ring-[var(--color-accent-gold)] shadow-sm',
    'accent-gold': 'bg-[var(--color-accent-gold)] text-white hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 focus:ring-[var(--color-accent-gold)] shadow-md',
    'accent-rust': 'bg-[var(--color-accent-rust)] text-white hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 focus:ring-[var(--color-accent-rust)] shadow-md',
    success: 'bg-[var(--color-success)] text-white hover:brightness-110 hover:shadow-lg focus:ring-[var(--color-success)] shadow-md',
    error: 'bg-[var(--color-error)] text-white hover:brightness-110 hover:shadow-lg focus:ring-[var(--color-error)] shadow-md',
    outline: 'border-2 border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-gold)] hover:text-white hover:border-[var(--color-accent-gold)] focus:ring-[var(--color-accent-gold)] bg-transparent'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[40px] touch-target',
    md: 'px-4 py-2.5 text-base min-h-[44px] touch-target',
    lg: 'px-6 py-3.5 text-lg min-h-[48px] touch-target'
  };
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClasses,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}