'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ImportResult } from '@/lib/csv-import';
import {
  IoCheckmarkCircleOutline, IoCloseCircleOutline,
  IoAlertCircleOutline,
} from 'react-icons/io5';
import styles from './CsvImport.module.css';

interface Props {
  result: ImportResult;
  newPaymentMethods?: string[];
  onDone: () => void;
}

export default function CsvImportSummary({ result, newPaymentMethods, onDone }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const router = useRouter();

  const allSuccess = result.failed === 0 && result.successful > 0;

  return (
    <div className={styles.summary}>
      <div className={styles.summaryIcon} style={{ color: allSuccess ? colors.success : colors.warning }}>
        {allSuccess ? <IoCheckmarkCircleOutline /> : <IoAlertCircleOutline />}
      </div>

      <div className={styles.summaryTitle}>
        {allSuccess ? t('import.summarySuccess') : t('import.summaryPartial')}
      </div>
      <div className={styles.summarySubtitle}>
        {t('import.summaryDesc')}
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardValue} style={{ color: colors.text }}>
            {result.total}
          </div>
          <div className={styles.summaryCardLabel}>{t('import.totalRows')}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardValue} style={{ color: colors.success }}>
            {result.successful}
          </div>
          <div className={styles.summaryCardLabel}>{t('import.successfulRows')}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardValue} style={{ color: colors.danger }}>
            {result.failed}
          </div>
          <div className={styles.summaryCardLabel}>{t('import.failedRows')}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryCardValue} style={{ color: colors.textSecondary }}>
            {result.skipped}
          </div>
          <div className={styles.summaryCardLabel}>{t('import.skippedRows')}</div>
        </div>
      </div>

      {/* New payment methods auto-created */}
      {newPaymentMethods && newPaymentMethods.length > 0 && (
        <div className={styles.newMethodsNotice} style={{ textAlign: 'start', margin: '0 0 16px' }}>
          <IoCheckmarkCircleOutline className={styles.newMethodsIcon} />
          <div>
            <strong>{t('import.newMethodsCreated')}:</strong>{' '}
            {newPaymentMethods.join('، ')}
          </div>
        </div>
      )}

      {/* Failed rows details */}
      {result.errors.length > 0 && (
        <div style={{
          textAlign: 'start', marginBottom: 16, padding: '12px',
          background: 'rgba(220,38,38,0.04)', borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(220,38,38,0.1)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.danger, marginBottom: 6 }}>
            {t('import.failedDetails')}:
          </div>
          {result.errors.slice(0, 10).map((err, idx) => (
            <div key={idx} style={{ fontSize: 12, color: colors.textSecondary, padding: '2px 0' }}>
              <IoCloseCircleOutline style={{ color: colors.danger, verticalAlign: 'middle' }} />{' '}
              {t('import.row')} {err.rowNumber}: {err.error}
            </div>
          ))}
          {result.errors.length > 10 && (
            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              +{result.errors.length - 10} {t('import.moreErrors')}
            </div>
          )}
        </div>
      )}

      <div className={styles.importActions} style={{ justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => router.push('/')}>
          {t('import.goHome')}
        </button>
        <button className="btn btn-outline" onClick={onDone}>
          {t('import.importMore')}
        </button>
      </div>
    </div>
  );
}
