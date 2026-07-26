'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoClose } from 'react-icons/io5';
import { Debt } from '@/types/expense';
import { useSettings } from '@/lib/settings-context';
import { sarToYmr, ymrToSar } from '@/lib/storage';

interface Props {
  debt: Debt;
  onClose: () => void;
  onSubmit: (data: { amountSar: number; amountYmr: number; date: string; category: string; paymentMethod: string }) => Promise<void>;
}

export default function PayInstallmentModal({ debt, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const { categories, paymentMethods, exchangeRate, currencyConfig } = useSettings();

  const [amountSar, setAmountSar] = useState('');
  const [amountYmr, setAmountYmr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAmountSarChange = (val: string) => {
    setAmountSar(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmountYmr(sarToYmr(num, exchangeRate).toString());
    } else {
      setAmountYmr('');
    }
  };

  const handleAmountYmrChange = (val: string) => {
    setAmountYmr(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setAmountSar(ymrToSar(num, exchangeRate).toString());
    } else {
      setAmountSar('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!amountSar && !amountYmr) || !category || !paymentMethod) return;
    setSaving(true);
    try {
      await onSubmit({
        amountSar: parseFloat(amountSar) || 0,
        amountYmr: parseFloat(amountYmr) || 0,
        date,
        category,
        paymentMethod
      });
      onClose();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const maxSar = debt.remaining_amount_sar > 0 
    ? debt.remaining_amount_sar 
    : (debt.remaining_amount_ymr > 0 ? ymrToSar(debt.remaining_amount_ymr, exchangeRate) : undefined);

  const maxYmr = debt.remaining_amount_ymr > 0 
    ? debt.remaining_amount_ymr 
    : (debt.remaining_amount_sar > 0 ? sarToYmr(debt.remaining_amount_sar, exchangeRate) : undefined);

  const displayRemainingYmr = debt.remaining_amount_ymr > 0 
    ? debt.remaining_amount_ymr 
    : (debt.remaining_amount_sar > 0 ? sarToYmr(debt.remaining_amount_sar, exchangeRate) : 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('debts.payInstallment')}</h2>
          <button className="icon-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          <div style={{ marginBottom: 16, padding: 12, background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{t('debts.debtName')}</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{debt.name}</div>

            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{t('debts.remainingAmount')}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-expense)' }}>
              {debt.remaining_amount_sar.toFixed(2)} {currencyConfig.primary.symbol} / {displayRemainingYmr.toLocaleString()} {currencyConfig.secondary.symbol}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="label">{t('debts.paymentAmount')} ({currencyConfig.primary.symbol})</label>
              <input className="input" type="number" step="0.01" max={maxSar} value={amountSar} onChange={e => handleAmountSarChange(e.target.value)} placeholder="0.00" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">{t('debts.paymentAmount')} ({currencyConfig.secondary.symbol})</label>
              <input className="input" type="number" step="0.01" max={maxYmr} value={amountYmr} onChange={e => handleAmountYmrChange(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <label className="label">{t('debts.paymentDate')}</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required />

          <label className="label">{t('debts.expenseCategory')}</label>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)} required>
            <option value="">{t('form.selectMainCategory')}</option>
            {categories.map(c => <option key={c.main} value={c.main}>{c.main}</option>)}
          </select>

          <label className="label">{t('form.paymentMethod')}</label>
          <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
            <option value="">{t('form.selectPaymentMethod')}</option>
            {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving || (!amountSar && !amountYmr) || !category || !paymentMethod}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
