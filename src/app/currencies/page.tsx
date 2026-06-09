'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/lib/settings-context';
import { alert } from '@/lib/alert';
import { IoArrowBack, IoCashOutline } from 'react-icons/io5';

export default function CurrenciesPage() {
  const colors = useThemeColor();
  const router = useRouter();
  const { t } = useTranslation();
  const { exchangeRate, currencyConfig, updateCurrencyConfig, ready } = useSettings();
  
  const [rate, setRate] = useState('');

  useEffect(() => {
    if (ready) {
      setRate(exchangeRate.toString());
    }
  }, [ready, exchangeRate]);

  const handleSaveRate = async () => {
    const val = parseFloat(rate);
    if (isNaN(val) || val <= 0) { alert(t('common.error'), t('settings.invalidRate')); return; }
    await updateCurrencyConfig({ ...currencyConfig, exchangeRate: val });
    alert(t('common.done'), t('settings.rateSaved'));
  };

  if (!ready) return <div className="spinner" style={{ minHeight: 400 }} />;

  return (
    <>
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.back()}><IoArrowBack /></button>
        <h1>{t('settings.currencies')}</h1>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: 16 }}>
        <div className="card" style={{ margin: '0 0 16px' }}>
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
      </div>
    </>
  );
}
