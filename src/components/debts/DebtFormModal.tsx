'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoClose } from 'react-icons/io5';
import { Debt } from '@/types/expense';
import { useSettings } from '@/lib/settings-context';
import { sarToYmr, ymrToSar } from '@/lib/storage';

interface Props {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    total_amount_sar: number;
    remaining_amount_sar: number;
    total_amount_ymr: number;
    remaining_amount_ymr: number;
    start_date: string;
    notes: string;
  }) => Promise<void>;
  initialData?: Debt;
}

export default function DebtFormModal({ onClose, onSubmit, initialData }: Props) {
  const { t } = useTranslation();
  const { exchangeRate, currencyConfig } = useSettings();
  const isEditing = !!initialData;
  
  const [name, setName] = useState(initialData?.name || '');
  const [amountSar, setAmountSar] = useState(initialData?.total_amount_sar?.toString() || '');
  const [amountYmr, setAmountYmr] = useState(initialData?.total_amount_ymr?.toString() || '');
  const [remainingSar, setRemainingSar] = useState(initialData?.remaining_amount_sar?.toString() || '');
  const [remainingYmr, setRemainingYmr] = useState(initialData?.remaining_amount_ymr?.toString() || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');
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

  const handleRemainingSarChange = (val: string) => {
    setRemainingSar(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setRemainingYmr(sarToYmr(num, exchangeRate).toString());
    } else {
      setRemainingYmr('');
    }
  };

  const handleRemainingYmrChange = (val: string) => {
    setRemainingYmr(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setRemainingSar(ymrToSar(num, exchangeRate).toString());
    } else {
      setRemainingSar('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!amountSar && !amountYmr)) return;
    setSaving(true);
    try {
      const totalSar = parseFloat(amountSar) || 0;
      const totalYmr = parseFloat(amountYmr) || 0;
      const remSar = isEditing ? (parseFloat(remainingSar) || 0) : totalSar;
      const remYmr = isEditing ? (parseFloat(remainingYmr) || 0) : totalYmr;

      await onSubmit({
        name: name.trim(),
        total_amount_sar: totalSar,
        remaining_amount_sar: remSar,
        total_amount_ymr: totalYmr,
        remaining_amount_ymr: remYmr,
        start_date: startDate,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? t('common.edit') : t('debts.addDebt')}</h2>
          <button className="icon-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          <label className="label">{t('debts.debtName')}</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={t('debts.debtNamePlaceholder')} required />

          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="label">{t('debts.totalAmount')} ({currencyConfig.primary.symbol})</label>
              <input className="input" type="number" step="0.01" value={amountSar} onChange={e => handleAmountSarChange(e.target.value)} placeholder="0.00" required />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">{t('debts.totalAmount')} ({currencyConfig.secondary.symbol})</label>
              <input className="input" type="number" step="0.01" value={amountYmr} onChange={e => handleAmountYmrChange(e.target.value)} placeholder="0.00" required />
            </div>
          </div>

          {isEditing && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="label">{t('debts.remainingAmount')} ({currencyConfig.primary.symbol})</label>
                <input className="input" type="number" step="0.01" value={remainingSar} onChange={e => handleRemainingSarChange(e.target.value)} placeholder="0.00" required />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">{t('debts.remainingAmount')} ({currencyConfig.secondary.symbol})</label>
                <input className="input" type="number" step="0.01" value={remainingYmr} onChange={e => handleRemainingYmrChange(e.target.value)} placeholder="0.00" required />
              </div>
            </div>
          )}

          <label className="label">{t('debts.startDate')}</label>
          <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} required />

          <label className="label">{t('debts.notes')}</label>
          <textarea className="input textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('debts.notesPlaceholder')} />

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving || !name.trim() || (!amountSar && !amountYmr)}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
