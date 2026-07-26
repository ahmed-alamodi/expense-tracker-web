'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IoAdd, IoWalletOutline, IoTrashOutline, IoCreateOutline } from 'react-icons/io5';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Debt } from '@/types/expense';
import { getDebts, createDebt, updateDebt, payDebtInstallment, deleteDebt } from '@/lib/database';
import { isConfigured } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import { sarToYmr } from '@/lib/storage';
import DebtFormModal from '@/components/debts/DebtFormModal';
import PayInstallmentModal from '@/components/debts/PayInstallmentModal';

export default function DebtsPage() {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { exchangeRate, currencyConfig } = useSettings();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const fetchDebts = async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getDebts();
      setDebts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const handleAddDebt = async (data: {
    name: string;
    total_amount_sar: number;
    remaining_amount_sar: number;
    total_amount_ymr: number;
    remaining_amount_ymr: number;
    start_date: string;
    notes: string;
  }) => {
    await createDebt({
      name: data.name,
      total_amount_sar: data.total_amount_sar,
      remaining_amount_sar: data.remaining_amount_sar,
      total_amount_ymr: data.total_amount_ymr,
      remaining_amount_ymr: data.remaining_amount_ymr,
      start_date: data.start_date,
      notes: data.notes
    });
    fetchDebts();
  };

  const handleEditDebt = async (data: {
    name: string;
    total_amount_sar: number;
    remaining_amount_sar: number;
    total_amount_ymr: number;
    remaining_amount_ymr: number;
    start_date: string;
    notes: string;
  }) => {
    if (!editingDebt) return;
    await updateDebt(editingDebt.id, {
      name: data.name,
      total_amount_sar: data.total_amount_sar,
      remaining_amount_sar: data.remaining_amount_sar,
      total_amount_ymr: data.total_amount_ymr,
      remaining_amount_ymr: data.remaining_amount_ymr,
      start_date: data.start_date,
      notes: data.notes
    });
    fetchDebts();
  };

  const handlePayInstallment = async (data: { amountSar: number; amountYmr: number; date: string; category: string; paymentMethod: string }) => {
    if (!selectedDebt) return;

    // Create the expense record
    const expenseData = {
      date: data.date,
      main_category: data.category,
      sub_category: '',
      description: `${t('debts.paymentExpenseDescription')}${selectedDebt.name}`,
      amount_sar: data.amountSar,
      amount_ymr: data.amountYmr,
      exchange_rate: exchangeRate,
      payment_method: data.paymentMethod,
      notes: null,
      tag_id: null
    };

    await payDebtInstallment(
      selectedDebt.id,
      data.amountSar,
      data.amountYmr,
      expenseData,
      selectedDebt.remaining_amount_sar,
      selectedDebt.remaining_amount_ymr
    );
    fetchDebts();
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('debts.deleteConfirm'))) {
      try {
        await deleteDebt(id);
        fetchDebts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>{t('debts.title')}</h1>
        <button className="icon-btn" onClick={() => setShowAddModal(true)}>
          <IoAdd />
        </button>
      </div>

      <div className="page-content" style={{ padding: 16 }}>
        {loading ? (
          <div className="spinner" />
        ) : debts.length === 0 ? (
          <div className="empty-state">
            <IoWalletOutline />
            <h3>{t('debts.noDebts')}</h3>
            <p>{t('debts.noDebtsHint')}</p>
            <button className="btn btn-primary mt-4" onClick={() => setShowAddModal(true)}>
              {t('debts.addDebt')}
            </button>
          </div>
        ) : (
          debts.map(debt => {
            const total = debt.total_amount_sar || 0;
            const remaining = debt.remaining_amount_sar || 0;
            const progress = total > 0
              ? ((total - remaining) / total) * 100
              : (debt.total_amount_ymr > 0 ? ((debt.total_amount_ymr - debt.remaining_amount_ymr) / debt.total_amount_ymr) * 100 : 0);

            return (
              <div key={debt.id} className="card" style={{ margin: '0 0 16px 0' }}>
                <div className="flex-between mb-3">
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{debt.name}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="icon-btn" style={{ color: colors.tint, padding: 0 }} onClick={() => setEditingDebt(debt)}>
                      <IoCreateOutline size={18} />
                    </button>
                    <button className="icon-btn" style={{ color: colors.danger, padding: 0 }} onClick={() => handleDelete(debt.id)}>
                      <IoTrashOutline size={18} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: colors.textSecondary }}>{t('debts.remainingAmount')}</span>
                  <span style={{ fontWeight: 700, color: colors.expense }}>
                    {debt.remaining_amount_sar.toFixed(2)} {currencyConfig.primary.symbol} / {(debt.remaining_amount_ymr > 0 ? debt.remaining_amount_ymr : sarToYmr(debt.remaining_amount_sar, exchangeRate)).toLocaleString()} {currencyConfig.secondary.symbol}
                  </span>
                </div>

                <div className="progress-bar mb-3">
                  <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: colors.success }} />
                </div>

                <div className="flex-between mb-4 text-xs" style={{ color: colors.textSecondary }}>
                  <span>{t('debts.totalAmount')}: {debt.total_amount_sar.toFixed(2)} {currencyConfig.primary.symbol} / {(debt.total_amount_ymr > 0 ? debt.total_amount_ymr : sarToYmr(debt.total_amount_sar, exchangeRate)).toLocaleString()} {currencyConfig.secondary.symbol}</span>
                  <span>{debt.start_date}</span>
                </div>

                {debt.notes && (
                  <div className="text-sm mb-4" style={{ color: colors.textSecondary, background: 'var(--color-bg)', padding: 8, borderRadius: 6 }}>
                    {debt.notes}
                  </div>
                )}

                <button
                  className="btn btn-primary btn-full"
                  onClick={() => setSelectedDebt(debt)}
                  disabled={debt.remaining_amount_sar <= 0 && debt.remaining_amount_ymr <= 0}
                >
                  {t('debts.payInstallment')}
                </button>
              </div>
            );
          })
        )}
      </div>

      {showAddModal && (
        <DebtFormModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddDebt}
        />
      )}

      {editingDebt && (
        <DebtFormModal
          onClose={() => setEditingDebt(null)}
          onSubmit={handleEditDebt}
          initialData={editingDebt}
        />
      )}

      {selectedDebt && (
        <PayInstallmentModal
          debt={selectedDebt}
          onClose={() => setSelectedDebt(null)}
          onSubmit={handlePayInstallment}
        />
      )}
    </>
  );
}
