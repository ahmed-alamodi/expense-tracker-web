'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { isConfigured } from '@/lib/supabase';
import TabLayout from '@/components/TabLayout';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const isAuthPage = pathname === '/auth';

    if (!isConfigured && !isAuthPage) {
      router.replace('/auth');
      return;
    }

    if (!user && !isAuthPage) {
      router.replace('/auth');
    } else if (user && isAuthPage) {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-frame">
          <div className="spinner" style={{ minHeight: '100vh' }} />
        </div>
      </div>
    );
  }

  // Auth page renders without tabs
  if (pathname === '/auth') {
    return (
      <div className="app-shell">
        <div className="app-frame">
          {children}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <TabLayout>{children}</TabLayout>;
}
