'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMonthlyTotal } from '@/hooks/useExpenses';
import { useSettings } from '@/lib/settings-context';
import { isConfigured } from '@/lib/supabase';
import { getBudgets, upsertBudget } from '@/lib/database';
import { Budget } from '@/types/expense';
import { CATEGORY_COLORS } from '@/constants/categories';
import { alert } from '@/lib/alert';
import MonthPicker from '@/components/MonthPicker';
import { IoSave } from 'react-icons/io5';

export default function BudgetPage() {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [totalBudgetInput, setTotalBudgetInput] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [saving, setSaving] = useState(false);
  const { categories, currencyConfig } = useSettings();
  const { totalSar, byCategory, refresh: refreshExpenses } = useMonthlyTotal(month, year);

  const fetchBudgets = useCallback(async () => {
    if (!isConfigured) { setLoadingBudgets(false); return; }
    setLoadingBudgets(true);
    try {
      const data = await getBudgets(month, year);
      const totalBudget = data.find(b => b.category === 'total');
      setTotalBudgetInput(totalBudget ? totalBudget.amount.toString() : '');
      const catMap: Record<string, string> = {};
      for (const b of data) { if (b.category !== 'total') catMap[b.category] = b.amount.toString(); }
      setCategoryBudgets(catMap);
    } catch {} finally { setLoadingBudgets(false); }
  }, [month, year]);

  useEffect(() => { fetchBudgets(); refreshExpenses(); }, [month, year]);

  const handlePrev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const handleNext = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (totalBudgetInput) await upsertBudget({ month, year, category: 'total', amount: parseFloat(totalBudgetInput) });
      for (const [cat, val] of Object.entries(categoryBudgets)) {
        if (val) await upsertBudget({ month, year, category: cat, amount: parseFloat(val) });
      }
      alert(t('common.done'), t('budget.budgetSaved'));
      fetchBudgets();
    } catch (err: any) { alert(t('common.error'), err.message); }
    finally { setSaving(false); }
  };

  const totalBudget = parseFloat(totalBudgetInput) || 0;
  const totalPct = totalBudget > 0 ? (totalSar / totalBudget) * 100 : 0;
  const totalRemaining = totalBudget - totalSar;
  const getStatusColor = (pct: number) => pct >= 100 ? colors.danger : pct >= 80 ? colors.warning : colors.success;

  if (loadingBudgets) return <div className="spinner" style={{ minHeight: 400 }} />;

  return (
    <>
      <MonthPicker month={month} year={year} onPrev={handlePrev} onNext={handleNext} />

      {/* Total Budget */}
      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 12 }}>{t('budget.totalBudget')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>{t('budget.amountSar')}</span>
          <input className="input" style={{ flex: 1 }} type="number" value={totalBudgetInput} onChange={e => setTotalBudgetInput(e.target.value)} placeholder="0" />
        </div>
        {totalBudget > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: colors.text }}>
                {t('budget.spent')} {totalSar.toFixed(2)} / {totalBudget.toFixed(2)} {currencyConfig.primary.symbol}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: getStatusColor(totalPct) }}>{totalPct.toFixed(0)}%</span>
            </div>
            <div className="progress-bar" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${Math.min(totalPct, 100)}%`, background: getStatusColor(totalPct) }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: totalRemaining >= 0 ? colors.success : colors.danger }}>
              {totalRemaining >= 0
                ? `${t('budget.remaining')} ${totalRemaining.toFixed(2)} ${currencyConfig.primary.symbol}`
                : `${t('budget.exceeded')} ${Math.abs(totalRemaining).toFixed(2)} ${currencyConfig.primary.symbol}`}
            </div>
          </div>
        )}
      </div>

      {/* Category Budgets */}
      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 12 }}>{t('budget.categoryBudget')}</div>
        {categories.map(cat => {
          const spent = byCategory[cat.main]?.sar || 0;
          const budgetVal = parseFloat(categoryBudgets[cat.main] || '0');
          const pct = budgetVal > 0 ? (spent / budgetVal) * 100 : 0;
          const catColor = CATEGORY_COLORS[cat.main] || '#B0BEC5';
          return (
            <div key={cat.main} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: catColor }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{cat.main}</span>
                </div>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>{spent.toFixed(2)} {currencyConfig.primary.symbol}</span>
              </div>
              <input className="input" type="number" value={categoryBudgets[cat.main] || ''} onChange={e => setCategoryBudgets(prev => ({ ...prev, [cat.main]: e.target.value }))} placeholder={t('budget.budgetSar')} style={{ fontSize: 14 }} />
              {budgetVal > 0 && (
                <div className="progress-bar" style={{ marginTop: 4 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: getStatusColor(pct) }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '0 16px 30px' }}>
        <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
          <IoSave /> {saving ? t('common.saving') : t('budget.saveBudget')}
        </button>
      </div>
    </>
  );
}
