'use client';

import React from 'react';
import '@/lib/i18n';
import { AppThemeProvider } from '@/lib/theme-context';
import { AuthProvider } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/language-context';
import { NetworkProvider } from '@/lib/network-context';
import { SettingsProvider } from '@/lib/settings-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <NetworkProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </NetworkProvider>
        </LanguageProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
