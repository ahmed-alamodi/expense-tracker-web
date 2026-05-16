'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { getExpenseById, updateExpense } from '@/lib/database';
import { invalidateCachePattern } from '@/lib/cache';
import { alert } from '@/lib/alert';
import { Expense } from '@/types/expense';
import ExpenseForm from '@/components/ExpenseForm';
import { IoArrowBack } from 'react-icons/io5';

export default function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColor();
  const { t } = useTranslation();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpenseById(id).then(setExpense).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
    await updateExpense(id, data);
    await invalidateCachePattern('expenses_');
    await invalidateCachePattern('monthly_total_');
    alert(t('common.done'), t('expenses.expenseUpdated'), [
      { text: t('common.ok'), onPress: () => router.push('/') },
    ]);
  };

  if (loading) return <div className="spinner" style={{ minHeight: 400 }} />;
  if (!expense) return <div style={{ padding: 40, textAlign: 'center', color: colors.textSecondary }}>{t('expenses.notFound')}</div>;

  return (
    <>
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.back()}><IoArrowBack /></button>
        <h1>{t('expenses.editExpense')}</h1>
        <div style={{ width: 32 }} />
      </div>
      <ExpenseForm onSubmit={handleSubmit} submitLabel={t('common.save')} initialData={expense} />
    </>
  );
}
