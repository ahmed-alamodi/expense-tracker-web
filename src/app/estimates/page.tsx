'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/lib/settings-context';
import { isConfigured } from '@/lib/supabase';
import { getMonthlyEstimates, createMonthlyEstimate, updateMonthlyEstimate, deleteMonthlyEstimate } from '@/lib/database';
import { sarToYmr, ymrToSar } from '@/lib/storage';
import { MonthlyEstimate } from '@/types/expense';
import { alert } from '@/lib/alert';
import { IoArrowBack, IoAdd, IoCheckmarkCircle, IoClose, IoTrashOutline, IoPencilOutline, IoCalculatorOutline } from 'react-icons/io5';

export default function EstimatesPage() {
  const colors = useThemeColor();
  const router = useRouter();
  const { t } = useTranslation();
  const { categories, exchangeRate, currencyConfig } = useSettings();
  const [estimates, setEstimates] = useState<MonthlyEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MonthlyEstimate | null>(null);
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amountSar, setAmountSar] = useState('');
  const [amountYmr, setAmountYmr] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const subCategories = categories.find(c => c.main === mainCategory)?.subs || [];

  const fetchData = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    setLoading(true);
    try { setEstimates(await getMonthlyEstimates()); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setMainCategory(''); setSubCategory(''); setDescription(''); setAmountSar(''); setAmountYmr(''); setNotes(''); setEditingItem(null); };

  const openEdit = (item: MonthlyEstimate) => {
    setEditingItem(item); setMainCategory(item.main_category); setSubCategory(item.sub_category);
    setDescription(item.description); setAmountSar(item.amount_sar.toString()); setAmountYmr(item.amount_ymr.toString());
    setNotes(item.notes || ''); setShowForm(true);
  };

  const handleSarChange = (val: string) => { setAmountSar(val); const n = parseFloat(val); if (!isNaN(n)) setAmountYmr(sarToYmr(n, exchangeRate).toString()); };
  const handleYmrChange = (val: string) => { setAmountYmr(val); const n = parseFloat(val); if (!isNaN(n)) setAmountSar(ymrToSar(n, exchangeRate).toString()); };

  const handleSave = async () => {
    if (!mainCategory) { alert(t('common.warning'), t('estimates.selectMainCategoryAlert')); return; }
    if (!description.trim()) { alert(t('common.warning'), t('estimates.enterDescription')); return; }
    setSaving(true);
    try {
      const payload = { main_category: mainCategory, sub_category: subCategory, description: description.trim(), amount_sar: parseFloat(amountSar) || 0, amount_ymr: parseFloat(amountYmr) || 0, notes: notes.trim() || null };
      if (editingItem) await updateMonthlyEstimate(editingItem.id, payload);
      else await createMonthlyEstimate(payload);
      setShowForm(false); resetForm(); fetchData();
    } catch (err: any) { alert(t('common.error'), err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = (item: MonthlyEstimate) => {
    alert(t('common.delete'), `${t('common.delete')} "${item.description}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => { await deleteMonthlyEstimate(item.id); fetchData(); } },
    ]);
  };

  const totalSar = estimates.reduce((s, e) => s + e.amount_sar, 0);
  const totalYmr = estimates.reduce((s, e) => s + e.amount_ymr, 0);

  if (loading) return <div className="spinner" style={{ minHeight: 400 }} />;

  return (
    <>
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.back()}><IoArrowBack /></button>
        <h1>{t('estimates.monthlyEstimates')}</h1>
        <button className="icon-btn" style={{ color: colors.tint }} onClick={() => { resetForm(); setShowForm(true); }}><IoAdd style={{ fontSize: 26 }} /></button>
      </div>

      {estimates.length > 0 && (
        <div style={{ margin: 16, padding: 20, borderRadius: 16, background: colors.tint, textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{t('estimates.totalMonthlyEstimates')}</div>
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>{totalSar.toFixed(2)} {currencyConfig.primary.symbol}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 2 }}>{totalYmr.toLocaleString()} {currencyConfig.secondary.symbol}</div>
        </div>
      )}

      <div style={{ padding: '0 16px', paddingBottom: 30 }}>
        {estimates.length === 0 ? (
          <div className="empty-state">
            <IoCalculatorOutline />
            <h3>{t('estimates.noEstimates')}</h3>
            <p>{t('estimates.addEstimatesHint')}</p>
            <button className="btn btn-primary mt-4" onClick={() => { resetForm(); setShowForm(true); }}><IoAdd /> {t('estimates.addEstimate')}</button>
          </div>
        ) : estimates.map(item => (
          <div key={item.id} className="card" style={{ margin: '0 0 10px', padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{item.description}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{item.main_category}{item.sub_category ? ` › ${item.sub_category}` : ''}</div>
                {item.notes && <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' }}>{item.notes}</div>}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{item.amount_sar.toFixed(2)} {currencyConfig.primary.symbol}</div>
                <div style={{ fontSize: 12, color: colors.textSecondary }}>{item.amount_ymr.toLocaleString()} {currencyConfig.secondary.symbol}</div>
              </div>
            </div>
            <div style={{ display: 'flex', borderTop: `1px solid ${colors.border}` }}>
              <button style={{ flex: 1, padding: 10, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: colors.tint, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }} onClick={() => openEdit(item)}>
                <IoPencilOutline /> {t('common.edit')}
              </button>
              <button style={{ flex: 1, padding: 10, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: colors.danger, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }} onClick={() => handleDelete(item)}>
                <IoTrashOutline /> {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <button className="icon-btn" onClick={() => { setShowForm(false); resetForm(); }}><IoClose /></button>
              <h2>{editingItem ? t('estimates.editEstimate') : t('estimates.addMonthlyEstimate')}</h2>
            </div>
            <div style={{ padding: 16 }}>
              <label className="label">{t('estimates.mainCategory')}</label>
              <select className="input" value={mainCategory} onChange={e => { setMainCategory(e.target.value); setSubCategory(''); }}>
                <option value="">{t('estimates.selectMainCategory')}</option>
                {categories.map(c => <option key={c.main} value={c.main}>{c.main}</option>)}
              </select>

              <label className="label">{t('estimates.subCategory')}</label>
              <select className="input" value={subCategory} onChange={e => setSubCategory(e.target.value)} disabled={!mainCategory}>
                <option value="">{t('estimates.selectSubCategory')}</option>
                {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <label className="label">{t('estimates.itemDescription')}</label>
              <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('estimates.descPlaceholder')} />

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">{t('estimates.estimateSar')}</label>
                  <input className="input" type="number" step="0.01" value={amountSar} onChange={e => handleSarChange(e.target.value)} placeholder="0.00" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">{t('estimates.estimateYmr')}</label>
                  <input className="input" type="number" value={amountYmr} onChange={e => handleYmrChange(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                {t('estimates.exchangeRateHint')} {exchangeRate} {currencyConfig.secondary.symbol}
              </div>

              <label className="label">{t('estimates.notesOptional')}</label>
              <textarea className="input textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('estimates.notesPlaceholder')} />

              <button className="btn btn-primary btn-full mt-4" onClick={handleSave} disabled={saving}>
                <IoCheckmarkCircle /> {saving ? t('common.saving') : editingItem ? t('estimates.saveEdit') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
