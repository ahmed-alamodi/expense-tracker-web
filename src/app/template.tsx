'use client';

import AuthGuard from '@/components/AuthGuard';

export default function Template({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
