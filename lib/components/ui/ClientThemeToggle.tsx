'use client';

import React, { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

export function ClientThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]" />
    );
  }

  return <ThemeToggle />;
}