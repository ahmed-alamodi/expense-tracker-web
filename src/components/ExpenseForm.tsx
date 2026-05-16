'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/lib/settings-context';
import { sarToYmr, ymrToSar } from '@/lib/storage';
import { Expense, Tag } from '@/types/expense';
import { getTags } from '@/lib/database';
import { isConfigured } from '@/lib/supabase';

interface Props {
  onSubmit: (data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  submitLabel: string;
  initialData?: Expense;
}

export default function ExpenseForm({ onSubmit, submitLabel, initialData }: Props) {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const { categories, paymentMethods, exchangeRate, currencyConfig } = useSettings();
  const [tags, setTags] = useState<Tag[]>([]);

  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [mainCategory, setMainCategory] = useState(initialData?.main_category || '');
  const [subCategory, setSubCategory] = useState(initialData?.sub_category || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [amountSar, setAmountSar] = useState(initialData?.amount_sar?.toString() || '');
  const [amountYmr, setAmountYmr] = useState(initialData?.amount_ymr?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [tagId, setTagId] = useState(initialData?.tag_id || '');
  const [saving, setSaving] = useState(false);

  const subCategories = categories.find(c => c.main === mainCategory)?.subs || [];

  useEffect(() => {
    if (isConfigured) {
      getTags().then(setTags).catch(() => {});
    }
  }, []);

  const handleSarChange = (val: string) => {
    setAmountSar(val);
    const num = parseFloat(val);
    if (!isNaN(num)) setAmountYmr(sarToYmr(num, exchangeRate).toString());
  };

  const handleYmrChange = (val: string) => {
    setAmountYmr(val);
    const num = parseFloat(val);
    if (!isNaN(num)) setAmountSar(ymrToSar(num, exchangeRate).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainCategory || !description.trim() || (!amountSar && !amountYmr)) return;
    setSaving(true);
    try {
      await onSubmit({
        date,
        main_category: mainCategory,
        sub_category: subCategory,
        description: description.trim(),
        amount_sar: parseFloat(amountSar) || 0,
        amount_ymr: parseFloat(amountYmr) || 0,
        exchange_rate: exchangeRate,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        tag_id: tagId || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 16 }}>
      <label className="label">{t('form.date')}</label>
      <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />

      <label className="label">{t('form.mainCategory')}</label>
      <select className="input" value={mainCategory} onChange={e => { setMainCategory(e.target.value); setSubCategory(''); }}>
        <option value="">{t('form.selectCategory')}</option>
        {categories.map(c => <option key={c.main} value={c.main}>{c.main}</option>)}
      </select>

      {subCategories.length > 0 && (
        <>
          <label className="label">{t('form.subCategory')}</label>
          <select className="input" value={subCategory} onChange={e => setSubCategory(e.target.value)}>
            <option value="">{t('form.selectSubCategory')}</option>
            {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </>
      )}

      <label className="label">{t('form.description')}</label>
      <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('form.descPlaceholder')} />

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label className="label">{t('form.amountSar')} ({currencyConfig.primary.symbol})</label>
          <input className="input" type="number" step="0.01" value={amountSar} onChange={e => handleSarChange(e.target.value)} placeholder="0.00" />
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">{t('form.amountYmr')} ({currencyConfig.secondary.symbol})</label>
          <input className="input" type="number" value={amountYmr} onChange={e => handleYmrChange(e.target.value)} placeholder="0" />
        </div>
      </div>
      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
        {t('form.exchangeRate')}: 1 {currencyConfig.primary.symbol} = {exchangeRate} {currencyConfig.secondary.symbol}
      </div>

      <label className="label">{t('form.paymentMethod')}</label>
      <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
        <option value="">{t('form.selectPayment')}</option>
        {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      {tags.length > 0 && (
        <>
          <label className="label">{t('form.tag')}</label>
          <select className="input" value={tagId} onChange={e => setTagId(e.target.value)}>
            <option value="">{t('form.noTag')}</option>
            {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
          </select>
        </>
      )}

      <label className="label">{t('form.notes')}</label>
      <textarea className="input textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('form.notesPlaceholder')} />

      <button type="submit" className="btn btn-primary btn-full mt-4" disabled={saving}>
        {saving ? t('common.saving') : submitLabel}
      </button>
    </form>
  );
}
