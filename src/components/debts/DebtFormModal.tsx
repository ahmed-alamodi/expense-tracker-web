'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoClose } from 'react-icons/io5';
import { Debt } from '@/types/expense';

interface Props {
  onClose: () => void;
  onSubmit: (data: { name: string; total_amount_sar: number; remaining_amount_sar: number; start_date: string; notes: string }) => Promise<void>;
  initialData?: Debt;
}

export default function DebtFormModal({ onClose, onSubmit, initialData }: Props) {
  const { t } = useTranslation();
  const isEditing = !!initialData;
  
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.total_amount_sar?.toString() || '');
  const [remaining, setRemaining] = useState(initialData?.remaining_amount_sar?.toString() || '');
  const [startDate, setStartDate] = useState(initialData?.start_date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    setSaving(true);
    try {
      const totalAmount = parseFloat(amount) || 0;
      await onSubmit({
        name: name.trim(),
        total_amount_sar: totalAmount,
        remaining_amount_sar: isEditing ? (parseFloat(remaining) || 0) : totalAmount,
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

          <label className="label">{t('debts.totalAmount')} ({t('common.sar')})</label>
          <input className="input" type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />

          {isEditing && (
            <>
              <label className="label">{t('debts.remainingAmount')} ({t('common.sar')})</label>
              <input className="input" type="number" step="0.01" value={remaining} onChange={e => setRemaining(e.target.value)} placeholder="0.00" required />
            </>
          )}

          <label className="label">{t('debts.startDate')}</label>
          <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} required />

          <label className="label">{t('debts.notes')}</label>
          <textarea className="input textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('debts.notesPlaceholder')} />

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving || !name.trim() || !amount}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
