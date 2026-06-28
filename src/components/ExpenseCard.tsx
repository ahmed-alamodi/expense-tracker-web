'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/lib/settings-context';
import { Expense } from '@/types/expense';
import { IoTrashOutline, IoCreateOutline } from 'react-icons/io5';
import { alert } from '@/lib/alert';

interface Props {
  expense: Expense;
  onDelete: (id: string) => void;
}

export default function ExpenseCard({ expense, onDelete }: Props) {
  const colors = useThemeColor();
  const router = useRouter();
  const { t } = useTranslation();
  const { currencyConfig } = useSettings();

  const handleDelete = () => {
    alert(t('common.delete'), `${t('common.delete')} "${expense.description}"?`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => onDelete(expense.id) },
    ]);
  };

  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/expense/${expense.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{expense.description}</div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {expense.main_category}{expense.sub_category ? ` › ${expense.sub_category}` : ''}
          </div>
          <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
            {expense.date} · {expense.payment_method}
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.expense }}>
            {expense.amount_sar.toFixed(2)} {currencyConfig.primary.symbol}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>
            {expense.amount_ymr?.toLocaleString()} {currencyConfig.secondary.symbol}
          </div>
        </div>
      </div>
      {expense.notes && (
        <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, fontStyle: 'italic' }}>
          {expense.notes}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
        <button
          className="icon-btn"
          style={{ color: colors.tint, fontSize: 16 }}
          onClick={(e) => { e.stopPropagation(); router.push(`/expense/${expense.id}`); }}
        >
          <IoCreateOutline />
        </button>
        <button
          className="icon-btn"
          style={{ color: colors.danger, fontSize: 16 }}
          onClick={(e) => { e.stopPropagation(); handleDelete(); }}
        >
          <IoTrashOutline />
        </button>
      </div>
    </div>
  );
}
