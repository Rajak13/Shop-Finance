'use client';

import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto mobile-scroll">
      <div 
        className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center"
        onClick={handleOverlayClick}
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        
        {/* Modal panel */}
        <div
          className={clsx(
            'relative transform overflow-hidden bg-[var(--color-background)] text-left shadow-xl transition-all w-full',
            'rounded-t-lg sm:rounded-lg', // Rounded top on mobile, all corners on desktop
            'max-h-[90vh] sm:max-h-[85vh]', // Better height management
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-background)] z-10">
              {title && (
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] truncate pr-2">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors touch-target p-2 -m-2 flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-4 overflow-y-auto mobile-scroll max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-120px)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={clsx('border-b border-[var(--color-border)] pb-3 mb-4', className)}>
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={clsx(
      'border-t border-[var(--color-border)] pt-4 mt-4 sticky bottom-0 bg-[var(--color-background)]',
      'flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 sm:space-x-0',
      'mobile-button-stack sm:mobile-button-stack-reset',
      className
    )}>
      {children}
    </div>
  );
}