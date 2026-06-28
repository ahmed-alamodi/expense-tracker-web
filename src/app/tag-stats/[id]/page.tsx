'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/lib/settings-context';
import { getExpensesByTag, getTagStats, getTags } from '@/lib/database';
import { CATEGORY_COLORS } from '@/constants/categories';
import { Expense, Tag } from '@/types/expense';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { IoArrowBack } from 'react-icons/io5';

export default function TagStatsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColor();
  const { t } = useTranslation();
  const { currencyConfig } = useSettings();
  const [tag, setTag] = useState<Tag | null>(null);
  const [stats, setStats] = useState<{ totalSar: number; totalYmr: number; byCategory: Record<string, { sar: number; ymr: number; count: number }>; count: number } | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [allTags, tagStats, tagExpenses] = await Promise.all([
          getTags(), getTagStats(id), getExpensesByTag(id),
        ]);
        setTag(allTags.find(t => t.id === id) || null);
        setStats(tagStats);
        setExpenses(tagExpenses);
      } catch { } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="spinner" style={{ minHeight: 400 }} />;
  if (!tag || !stats) return <div style={{ padding: 40, textAlign: 'center', color: colors.textSecondary }}>{t('tags.notFound')}</div>;

  const pieData = Object.entries(stats.byCategory).sort((a, b) => b[1].sar - a[1].sar)
    .map(([name, data]) => ({ name, value: parseFloat(data.sar.toFixed(2)), color: CATEGORY_COLORS[name] || '#B0BEC5' }));

  return (
    <>
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.back()}><IoArrowBack /></button>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, background: tag.color }} />
          {tag.name}
        </h1>
        <div style={{ width: 32 }} />
      </div>

      {/* Summary */}
      <div style={{ margin: 16, padding: 20, borderRadius: 16, background: tag.color, textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{t('tags.tagTotal')}</div>
        <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>{stats.totalSar.toFixed(2)} {currencyConfig.primary.symbol}</div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 2 }}>{stats.totalYmr?.toLocaleString()} {currencyConfig.secondary.symbol}</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 6 }}>{stats.count} {t('tags.expensesCount')}</div>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{t('stats.categoryDistribution')}</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(val: any) => `${val ?? 0} ${currencyConfig.primary.symbol}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Expenses List */}
      <div style={{ fontSize: 15, fontWeight: 700, padding: '16px 16px 8px', color: colors.text }}>
        {t('tags.tagExpenses')} ({expenses.length})
      </div>
      {expenses.map(expense => (
        <div key={expense.id} className="card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/expense/${expense.id}`)}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{expense.description}</div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{expense.main_category} · {expense.date}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.expense }}>{expense.amount_sar.toFixed(2)} {currencyConfig.primary.symbol}</div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>{expense.amount_ymr?.toLocaleString()} {currencyConfig.secondary.symbol}</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
