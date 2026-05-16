'use client';

import { useAppTheme } from '@/lib/theme-context';

const lightColors = {
  text: '#1F2937',
  textSecondary: '#6B7280',
  background: '#F3F4F6',
  card: '#FFFFFF',
  border: '#E5E7EB',
  tint: '#2563EB',
  tabIconDefault: '#6B7280',
  expense: '#DC2626',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
};

const darkColors = {
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  background: '#111827',
  card: '#1F2937',
  border: '#374151',
  tint: '#60A5FA',
  tabIconDefault: '#6B7280',
  expense: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
};

export function useThemeColor() {
  const { colorScheme } = useAppTheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
}
