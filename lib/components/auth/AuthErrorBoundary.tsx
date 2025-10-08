'use client';

import React from 'react';
import { Button, Card, CardContent } from '../ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-[var(--color-accent-rust)] mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                Authentication Error
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Something went wrong with authentication. Please try refreshing the page.
              </p>
              <Button
                onClick={this.handleRetry}
                variant="accent-gold"
                className="w-full"
              >
                <RefreshCw size={16} className="mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}