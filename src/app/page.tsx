'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useExpenses, useMonthlyTotal } from '@/hooks/useExpenses';
import { useSettings } from '@/lib/settings-context';
import { useNetwork } from '@/lib/network-context';
import { deleteExpense } from '@/lib/database';
import { invalidateCachePattern } from '@/lib/cache';
import MonthPicker from '@/components/MonthPicker';
import ExpenseCard from '@/components/ExpenseCard';
import SearchFilter, { Filters } from '@/components/SearchFilter';
import { IoCloudOfflineOutline, IoSyncOutline } from 'react-icons/io5';

export default function HomePage() {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [filters, setFilters] = useState<Filters>({ search: '', mainCategory: '', paymentMethod: '' });
  const { categories: settingsCategories, paymentMethods: settingsPaymentMethods, currencyConfig } = useSettings();
  const { isOnline, pendingCount } = useNetwork();
  const categoryNames = settingsCategories.map(c => c.main);

  const { expenses, loading, refresh } = useExpenses({
    month, year, limit: 50,
    search: filters.search || undefined,
    mainCategory: filters.mainCategory || undefined,
    paymentMethod: filters.paymentMethod || undefined,
  });
  const { totalSar, totalYmr, byCategory, refresh: refreshTotal } = useMonthlyTotal(month, year);

  const handlePrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const handleNext = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      await invalidateCachePattern('expenses_');
      await invalidateCachePattern('monthly_total_');
      refresh();
      refreshTotal();
    } catch {}
  };

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1].sar - a[1].sar)
    .slice(0, 4);

  return (
    <>
      {(!isOnline || pendingCount > 0) && (
        <div className="status-banner" style={{ background: !isOnline ? '#FEF3C7' : '#DBEAFE', color: !isOnline ? '#D97706' : '#2563EB' }}>
          {!isOnline ? <IoCloudOfflineOutline /> : <IoSyncOutline />}
          <span>{!isOnline ? t('offline.banner') : `${t('offline.pending')}: ${pendingCount}`}</span>
        </div>
      )}

      <MonthPicker month={month} year={year} onPrev={handlePrev} onNext={handleNext} />

      {/* Summary Card */}
      <div className="card">
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: colors.textSecondary, marginBottom: 12 }}>
          {t('home.totalExpenses')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: colors.expense }}>{totalYmr.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>{currencyConfig.secondary.name}</div>
          </div>
          <div style={{ width: 1, height: 40, background: colors.border, margin: '0 16px' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: colors.expense }}>{totalSar.toFixed(2)}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>{currencyConfig.primary.name}</div>
          </div>
        </div>

        {topCategories.length > 0 && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
              {t('home.topCategories')}
            </div>
            {topCategories.map(([cat, data]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{cat}</span>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>
                  {data.sar.toFixed(2)} {currencyConfig.primary.symbol} ({data.count})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <SearchFilter filters={filters} onFiltersChange={setFilters} categoryNames={categoryNames} paymentMethods={settingsPaymentMethods} />

      <div style={{ fontSize: 15, fontWeight: 700, padding: '16px 16px 8px', color: colors.text }}>
        {t('home.expenses')} ({expenses.length})
      </div>

      {loading ? (
        <div className="spinner" />
      ) : expenses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: colors.textSecondary, fontSize: 15 }}>
          {t('home.noExpenses')}
        </div>
      ) : (
        expenses.map(expense => (
          <ExpenseCard key={expense.id} expense={expense} onDelete={handleDelete} />
        ))
      )}
    </>
  );
}
