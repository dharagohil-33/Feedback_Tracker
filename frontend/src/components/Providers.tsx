'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors closeButton duration={3500} />
      </AuthProvider>
    </ThemeProvider>
  );
}
