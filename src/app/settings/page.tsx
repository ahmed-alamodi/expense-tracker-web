'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppTheme, ThemeMode } from '@/lib/theme-context';
import { useLanguage, Language } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { useSettings } from '@/lib/settings-context';
import { isConfigured } from '@/lib/supabase';
import { getExpenses } from '@/lib/database';
import { alert } from '@/lib/alert';
import * as XLSX from 'xlsx';
import {
  IoColorPaletteOutline, IoLanguageOutline, IoDownloadOutline,
  IoCashOutline, IoCardOutline, IoCalculatorOutline, IoListOutline,
  IoPricetagsOutline, IoInformationCircleOutline, IoLogOutOutline,
  IoChevronBack, IoAdd, IoClose, IoDocumentOutline, IoWalletOutline,
} from 'react-icons/io5';

export default function SettingsPage() {
  const colors = useThemeColor();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useAppTheme();
  const { language, setLanguage } = useLanguage();
  const { ready } = useSettings();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!isConfigured) { alert(t('common.warning'), t('settings.setupSupabase')); return; }
    setExporting(true);
    try {
      const expenses = await getExpenses();
      if (expenses.length === 0) { alert(t('common.warning'), t('settings.noExpensesToExport')); setExporting(false); return; }
      const rows = expenses.map(e => ({
        [t('form.date')]: e.date, [t('form.mainCategory')]: e.main_category, [t('form.subCategory')]: e.sub_category,
        [t('form.description')]: e.description, [t('form.amountSar')]: e.amount_sar, [t('form.amountYmr')]: e.amount_ymr,
        [t('settings.exchangeRate')]: e.exchange_rate, [t('form.paymentMethod')]: e.payment_method, [t('form.notes')]: e.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t('home.expenses'));
      XLSX.writeFile(wb, `expenses_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err: any) {
      alert(t('common.error'), err.message || t('settings.exportFailed'));
    } finally { setExporting(false); }
  };

  const themeModes: { key: ThemeMode; label: string }[] = [
    { key: 'system', label: t('settings.themeSystem') },
    { key: 'light', label: t('settings.themeLight') },
    { key: 'dark', label: t('settings.themeDark') },
  ];

  const languages: { key: Language; label: string }[] = [
    { key: 'ar', label: 'العربية' },
    { key: 'en', label: 'English' },
  ];

  if (!ready) return <div className="spinner" style={{ minHeight: 400 }} />;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Theme */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <IoColorPaletteOutline style={{ fontSize: 22, color: colors.tint }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>{t('settings.theme')}</span>
        </div>
        <div className="segmented">
          {themeModes.map(item => (
            <button key={item.key} className={`segmented-btn ${themeMode === item.key ? 'active' : ''}`} onClick={() => setThemeMode(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <IoLanguageOutline style={{ fontSize: 22, color: colors.tint }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>{t('settings.language')}</span>
        </div>
        <div className="segmented">
          {languages.map(item => (
            <button key={item.key} className={`segmented-btn ${language === item.key ? 'active' : ''}`} onClick={() => setLanguage(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <IoDownloadOutline style={{ fontSize: 22, color: colors.tint }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>{t('settings.exportData')}</span>
        </div>
        <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>{t('settings.exportDesc')}</p>
        <button className="btn btn-primary btn-full" onClick={handleExport} disabled={exporting}>
          <IoDocumentOutline /> {exporting ? t('settings.exporting') : t('settings.exportExcel')}
        </button>
      </div>



      {/* Nav Cards */}
      {[
        { icon: IoCashOutline, label: t('settings.currencies'), desc: t('settings.manageCurrenciesDesc'), href: '/currencies' },
        { icon: IoCardOutline, label: t('settings.paymentMethods'), desc: t('settings.managePaymentMethodsDesc'), href: '/payment-methods' },
        { icon: IoCalculatorOutline, label: t('settings.monthlyEstimates'), desc: t('settings.monthlyEstimatesDesc'), href: '/estimates' },
        { icon: IoListOutline, label: t('settings.manageCategories'), desc: t('settings.manageCategoriesDesc'), href: '/categories' },
        { icon: IoPricetagsOutline, label: t('settings.manageTags'), desc: t('settings.manageTagsDesc'), href: '/tags' },
      ].map(item => (
        <div key={item.href} className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => router.push(item.href)}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <item.icon style={{ fontSize: 22, color: colors.tint }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>{item.label}</span>
            </div>
            <p style={{ fontSize: 13, color: colors.textSecondary }}>{item.desc}</p>
          </div>
          <IoChevronBack style={{ fontSize: 20, color: colors.textSecondary }} />
        </div>
      ))}

      {/* About */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <IoInformationCircleOutline style={{ fontSize: 22, color: colors.tint }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>{t('settings.aboutApp')}</span>
        </div>
        <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>{t('settings.appDesc')}</p>
        <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>{t('settings.appPurpose')}</p>
        {user && <p style={{ fontSize: 13, color: colors.textSecondary }}>{t('settings.account')} {user.email}</p>}
      </div>

      {/* Sign Out */}
      <div style={{ padding: '0 16px' }}>
        <button className="btn btn-outline-danger btn-full mt-3" onClick={() => {
          alert(t('settings.signOut'), t('settings.signOutConfirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('settings.signOut'), style: 'destructive', onPress: signOut },
          ]);
        }}>
          <IoLogOutOutline /> {t('settings.signOut')}
        </button>
      </div>
    </div>
  );
}
