'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMonthlyTotal } from '@/hooks/useExpenses';
import { useSettings } from '@/lib/settings-context';
import { getMonthlyTotals } from '@/lib/database';
import MonthPicker from '@/components/MonthPicker';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORY_COLORS } from '@/constants/categories';
import { isConfigured } from '@/lib/supabase';

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

export default function StatsPage() {
  const colors = useThemeColor();
  const { t } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [yearlyTotals, setYearlyTotals] = useState<number[]>(Array(12).fill(0));

  const { currencyConfig } = useSettings();
  const { totalSar, byCategory, loading, refresh } = useMonthlyTotal(month, year);

  const fetchYearly = useCallback(async () => {
    if (!isConfigured) return;
    try {
      const data = await getMonthlyTotals(year);
      setYearlyTotals(data);
    } catch { }
  }, [year]);

  useEffect(() => { refresh(); fetchYearly(); }, [month, year]);

  const handlePrev = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const handleNext = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const pieData = Object.entries(byCategory)
    .sort((a, b) => b[1].sar - a[1].sar)
    .map(([name, data]) => ({
      name, value: parseFloat(data.sar.toFixed(2)),
      color: CATEGORY_COLORS[name] || '#B0BEC5',
    }));

  const currentMonthIdx = month - 1;
  const barData: { name: string; total: number }[] = [];
  for (let i = Math.max(0, currentMonthIdx - 5); i <= currentMonthIdx; i++) {
    barData.push({
      name: t(`months.${MONTH_KEYS[i]}`).slice(0, 5),
      total: parseFloat((yearlyTotals[i] || 0).toFixed(2)),
    });
  }

  if (loading) return <div className="spinner" style={{ minHeight: 400 }} />;

  return (
    <>
      <MonthPicker month={month} year={year} onPrev={handlePrev} onNext={handleNext} />

      {/* Total */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary }}>{t('stats.monthlyTotal')}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: colors.expense, marginTop: 4 }}>
          {totalSar.toFixed(2)} {currencyConfig.primary.symbol}
        </div>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: colors.text }}>{t('stats.categoryDistribution')}</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(val) => `${val ?? 0} ${currencyConfig.primary.symbol}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 20, color: colors.textSecondary }}>
          {t('stats.noData')}
        </div>
      )}

      {/* Bar Chart */}
      {barData.some(v => v.total > 0) && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: colors.text }}>{t('stats.monthlyComparison')} ({year})</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fill: colors.textSecondary, fontSize: 12 }} />
              <YAxis tick={{ fill: colors.textSecondary, fontSize: 11 }} />
              <Tooltip formatter={(val: any) => `${val ?? 0} ${currencyConfig.primary.symbol}`} />
              <Bar dataKey="total" fill={colors.tint} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      {pieData.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: colors.text }}>{t('stats.categoryDetails')}</div>
          {Object.entries(byCategory).sort((a, b) => b[1].sar - a[1].sar).map(([cat, data]) => {
            const pct = totalSar > 0 ? (data.sar / totalSar) * 100 : 0;
            const barColor = CATEGORY_COLORS[cat] || '#B0BEC5';
            return (
              <div key={cat} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: barColor }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{cat}</span>
                  </div>
                  <span style={{ fontSize: 13, color: colors.textSecondary }}>
                    {data.sar.toFixed(2)} {currencyConfig.primary.symbol} ({data.count})
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
