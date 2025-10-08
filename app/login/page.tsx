'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../../lib/components/ui';
import { AuthLayout } from '../../lib/components/layout/AuthLayout';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { useAuth } from '../../lib/contexts/AuthContext';
import { Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginError {
  message: string;
  field?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      setError({ message: 'Email is required', field: 'email' });
      return false;
    }

    if (!formData.email.includes('@')) {
      setError({ message: 'Please enter a valid email address', field: 'email' });
      return false;
    }

    if (!formData.password.trim()) {
      setError({ message: 'Password is required', field: 'password' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Redirect to dashboard on successful login
        router.replace('/');
      } else {
        setError({
          message: result.error || 'Login failed. Please try again.',
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setError({
        message: 'Network error. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-accent-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </AuthLayout>
    );
  }

  // Don't render if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout>
      {/* Login Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            <LogIn className="w-6 h-6 mx-auto mb-2 text-[var(--color-accent-gold)]" />
            Sign In to Your Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Global Error Message */}
            {error && !error.field && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                {error.message}
              </div>
            )}

            {/* Email Field */}
            <div>
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email address"
                fullWidth
                disabled={isLoading}
                error={error?.field === 'email' ? error.message : undefined}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                fullWidth
                disabled={isLoading}
                error={error?.field === 'password' ? error.message : undefined}
                autoComplete="current-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="accent-gold"
              fullWidth
              disabled={isLoading}
              className="mt-6"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing In...
                </div>
              ) : (
                <>
                  <LogIn size={16} className="mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>


        </CardContent>
      </Card>
    </AuthLayout>
  );
}