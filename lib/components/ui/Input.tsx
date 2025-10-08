'use client';

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'block px-3 py-3 border rounded-lg text-[var(--color-text-primary)] bg-[var(--color-surface-elevated)] placeholder-[var(--color-text-muted)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)] focus:border-[var(--color-accent-gold)] focus:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-base touch-target';
  
  const errorClasses = error 
    ? 'border-[var(--color-error)] focus:ring-[var(--color-error)] focus:border-[var(--color-error)]' 
    : 'border-[var(--color-border)] hover:border-[var(--color-accent-gold)]';
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const paddingClasses = clsx({
    'pl-10': leftIcon,
    'pr-10': rightIcon,
  });

  return (
    <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-[var(--color-text-secondary)]">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            baseClasses,
            errorClasses,
            widthClasses,
            paddingClasses,
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="text-[var(--color-text-secondary)]">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="mt-1 text-sm">
          {error ? (
            <span className="text-[var(--color-error)]">{error}</span>
          ) : (
            <span className="text-[var(--color-text-secondary)]">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';