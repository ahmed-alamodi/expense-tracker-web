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
  IoChevronBack, IoAdd, IoClose, IoDocumentOutline,
} from 'react-icons/io5';

export default function SettingsPage() {
  const colors = useThemeColor();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useAppTheme();
  const { language, setLanguage } = useLanguage();
  const { exchangeRate, paymentMethods, currencyConfig, updatePaymentMethods, updateCurrencyConfig, ready } = useSettings();
  const [rate, setRate] = useState('');
  const [methods, setMethods] = useState<string[]>([]);
  const [newMethod, setNewMethod] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (ready) { setRate(exchangeRate.toString()); setMethods(paymentMethods); }
  }, [ready, exchangeRate, paymentMethods]);

  const handleSaveRate = async () => {
    const val = parseFloat(rate);
    if (isNaN(val) || val <= 0) { alert(t('common.error'), t('settings.invalidRate')); return; }
    await updateCurrencyConfig({ ...currencyConfig, exchangeRate: val });
    alert(t('common.done'), t('settings.rateSaved'));
  };

  const handleAddMethod = async () => {
    if (!newMethod.trim()) return;
    if (methods.includes(newMethod.trim())) { alert(t('common.warning'), t('settings.methodExists')); return; }
    const updated = [...methods, newMethod.trim()];
    setMethods(updated);
    await updatePaymentMethods(updated);
    setNewMethod('');
  };

  const handleRemoveMethod = async (method: string) => {
    alert(t('common.delete'), `${t('common.delete')} "${method}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        const updated = methods.filter(m => m !== method);
        setMethods(updated);
        await updatePaymentMethods(updated);
      }},
    ]);
  };

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

      {/* Currency */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <IoCashOutline style={{ fontSize: 22, color: colors.tint }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>{t('settings.currencies')}</span>
        </div>
        <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>{t('settings.currenciesDesc')}</p>

        <label className="label">{t('settings.primaryCurrency')}</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input className="input" style={{ flex: 1 }} value={currencyConfig.primary.name} onChange={e => updateCurrencyConfig({ ...currencyConfig, primary: { ...currencyConfig.primary, name: e.target.value } })} placeholder={t('settings.currencyName')} />
          <input className="input" style={{ width: 60, textAlign: 'center', fontWeight: 700 }} value={currencyConfig.primary.symbol} onChange={e => updateCurrencyConfig({ ...currencyConfig, primary: { ...currencyConfig.primary, symbol: e.target.value } })} />
        </div>

        <label className="label">{t('settings.secondaryCurrency')}</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input className="input" style={{ flex: 1 }} value={currencyConfig.secondary.name} onChange={e => updateCurrencyConfig({ ...currencyConfig, secondary: { ...currencyConfig.secondary, name: e.target.value } })} placeholder={t('settings.currencyName')} />
          <input className="input" style={{ width: 60, textAlign: 'center', fontWeight: 700 }} value={currencyConfig.secondary.symbol} onChange={e => updateCurrencyConfig({ ...currencyConfig, secondary: { ...currencyConfig.secondary, symbol: e.target.value } })} />
        </div>

        <label className="label">{t('settings.exchangeRate')}</label>
        <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 4 }}>1 {currencyConfig.primary.symbol} = ? {currencyConfig.secondary.symbol}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" style={{ flex: 1 }} type="number" value={rate} onChange={e => setRate(e.target.value)} />
          <button className="btn btn-primary btn-small" onClick={handleSaveRate}>{t('common.save')}</button>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <IoCardOutline style={{ fontSize: 22, color: colors.tint }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>{t('settings.paymentMethods')}</span>
        </div>
        {methods.map(method => (
          <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: 15 }}>{method}</span>
            <button className="icon-btn" style={{ color: colors.danger, fontSize: 18 }} onClick={() => handleRemoveMethod(method)}><IoClose /></button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input className="input" style={{ flex: 1 }} value={newMethod} onChange={e => setNewMethod(e.target.value)} placeholder={t('settings.newPaymentMethod')} />
          <button className="btn btn-small" style={{ background: colors.success, color: '#fff' }} onClick={handleAddMethod}><IoAdd /></button>
        </div>
      </div>

      {/* Nav Cards */}
      {[
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
