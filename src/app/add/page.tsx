'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useNetwork } from '@/lib/network-context';
import { createExpense } from '@/lib/database';
import { addToQueue, generateTempId } from '@/lib/sync-queue';
import { invalidateCachePattern } from '@/lib/cache';
import { alert } from '@/lib/alert';
import { Expense } from '@/types/expense';
import ExpenseForm from '@/components/ExpenseForm';
import { IoCloudOfflineOutline } from 'react-icons/io5';

export default function AddPage() {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { isOnline, refreshPendingCount } = useNetwork();
  const router = useRouter();

  const handleSubmit = async (data: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => {
    if (isOnline) {
      await createExpense(data);
      await invalidateCachePattern('expenses_');
      await invalidateCachePattern('monthly_total_');
    } else {
      const tempId = await generateTempId();
      await addToQueue({
        type: 'create', table: 'expenses',
        data: { ...data, id: tempId, _pendingSync: true },
      });
      await refreshPendingCount();
    }
    alert(t('common.done'), t('add.expenseAdded'), [
      { text: t('common.ok'), onPress: () => router.push('/') },
    ]);
  };

  return (
    <>
      {!isOnline && (
        <div className="status-banner" style={{ background: colors.warning + '20', color: colors.warning }}>
          <IoCloudOfflineOutline />
          <span>{t('offline.banner')}</span>
        </div>
      )}
      <ExpenseForm onSubmit={handleSubmit} submitLabel={t('add.addExpense')} />
    </>
  );
}
