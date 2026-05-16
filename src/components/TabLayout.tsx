'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { IoHome, IoAddCircle, IoBarChart, IoWallet, IoSettings } from 'react-icons/io5';

const tabs = [
  { href: '/', icon: IoHome, labelKey: 'tabs.home' },
  { href: '/add', icon: IoAddCircle, labelKey: 'tabs.add' },
  { href: '/stats', icon: IoBarChart, labelKey: 'tabs.stats' },
  { href: '/budget', icon: IoWallet, labelKey: 'tabs.budget' },
  { href: '/settings', icon: IoSettings, labelKey: 'tabs.settings' },
];

export default function TabLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <div className="app-frame">
        <div className="page-content">
          {children}
        </div>
        <nav className="tab-bar">
          {tabs.map(tab => {
            const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`tab-item ${isActive ? 'active' : ''}`}
              >
                <tab.icon />
                <span>{t(tab.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
