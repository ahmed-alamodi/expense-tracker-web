'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IoSearchOutline, IoClose } from 'react-icons/io5';

export interface Filters {
  search: string;
  mainCategory: string;
  paymentMethod: string;
}

interface Props {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  categoryNames: string[];
  paymentMethods: string[];
}

export default function SearchFilter({ filters, onFiltersChange, categoryNames, paymentMethods }: Props) {
  const colors = useThemeColor();
  const { t } = useTranslation();

  return (
    <div style={{ padding: '8px 16px' }}>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: colors.card, border: `1px solid ${colors.border}`,
        borderRadius: 10, padding: '0 12px',
      }}>
        <IoSearchOutline style={{ color: colors.textSecondary, fontSize: 18 }} />
        <input
          className="input"
          style={{ border: 'none', background: 'transparent', padding: '10px 0' }}
          placeholder={t('home.search')}
          value={filters.search}
          onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
        />
        {filters.search && (
          <button className="icon-btn" style={{ fontSize: 16 }} onClick={() => onFiltersChange({ ...filters, search: '' })}>
            <IoClose />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <select
          className="input"
          style={{ flex: 1, minWidth: 120, padding: 8, fontSize: 13 }}
          value={filters.mainCategory}
          onChange={e => onFiltersChange({ ...filters, mainCategory: e.target.value })}
        >
          <option value="">{t('home.allCategories')}</option>
          {categoryNames.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          className="input"
          style={{ flex: 1, minWidth: 120, padding: 8, fontSize: 13 }}
          value={filters.paymentMethod}
          onChange={e => onFiltersChange({ ...filters, paymentMethod: e.target.value })}
        >
          <option value="">{t('home.allPayments')}</option>
          {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}
