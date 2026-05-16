'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;

interface Props {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function MonthPicker({ month, year, onPrev, onNext }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColor();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
    }}>
      <button onClick={onNext} className="icon-btn"><IoChevronForward /></button>
      <span style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
        {t(`months.${MONTH_KEYS[month - 1]}`)} {year}
      </span>
      <button onClick={onPrev} className="icon-btn"><IoChevronBack /></button>
    </div>
  );
}
