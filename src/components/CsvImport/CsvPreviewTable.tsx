'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ParseKeys } from 'i18next';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ParsedRow, CsvParseResult } from '@/lib/csv-import';
import {
  IoCheckmarkCircle, IoAlertCircle, IoCloseCircle, IoCopyOutline,
} from 'react-icons/io5';
import styles from './CsvImport.module.css';

interface Props {
  result: CsvParseResult;
}

function StatusBadge({ status }: { status: ParsedRow['status'] }) {
  const { t } = useTranslation();
  const config = {
    valid: { className: styles.statusValid, icon: <IoCheckmarkCircle />, label: t('import.statusValid') },
    warning: { className: styles.statusWarning, icon: <IoAlertCircle />, label: t('import.statusWarning') },
    error: { className: styles.statusError, icon: <IoCloseCircle />, label: t('import.statusError') },
    duplicate: { className: styles.statusDuplicate, icon: <IoCopyOutline />, label: t('import.statusDuplicate') },
  }[status];

  return (
    <span className={`${styles.rowStatus} ${config.className}`}>
      {config.icon} {config.label}
    </span>
  );
}

function RowClassName(status: ParsedRow['status']): string {
  return {
    valid: styles.rowValid,
    warning: styles.rowWarning,
    error: styles.rowError,
    duplicate: styles.rowDuplicate,
  }[status];
}

export default function CsvPreviewTable({ result }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const { rows, totalRows, validRows, errorRows, warningRows, duplicateRows } = result;

  return (
    <div className={styles.previewContainer}>
      {/* Header stats */}
      <div className={styles.previewHeader}>
        <div className={styles.previewStats}>
          <div className={styles.previewStat}>
            <span className={`${styles.statDot} ${styles.statDotValid}`} />
            <span style={{ color: colors.success }}>{validRows} {t('import.valid')}</span>
          </div>
          {warningRows > 0 && (
            <div className={styles.previewStat}>
              <span className={`${styles.statDot} ${styles.statDotWarning}`} />
              <span style={{ color: colors.warning }}>{warningRows} {t('import.warnings')}</span>
            </div>
          )}
          {errorRows > 0 && (
            <div className={styles.previewStat}>
              <span className={`${styles.statDot} ${styles.statDotError}`} />
              <span style={{ color: colors.danger }}>{errorRows} {t('import.errors')}</span>
            </div>
          )}
          {duplicateRows > 0 && (
            <div className={styles.previewStat}>
              <span className={`${styles.statDot} ${styles.statDotDuplicate}`} />
              <span style={{ color: '#8B5CF6' }}>{duplicateRows} {t('import.duplicates')}</span>
            </div>
          )}
          <div className={styles.previewStat}>
            <span style={{ color: colors.textSecondary }}>{t('import.totalRows')}: {totalRows}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.previewTableWrapper}>
        <table className={styles.previewTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>{t('import.colStatus')}</th>
              <th>{t('form.date')}</th>
              <th>{t('form.mainCategory')}</th>
              <th>{t('form.subCategory')}</th>
              <th>{t('form.description')}</th>
              <th>{t('form.amountSar')}</th>
              <th>{t('form.amountYmr')}</th>
              <th>{t('form.paymentMethod')}</th>
              <th>{t('form.notes')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <React.Fragment key={row.rowNumber}>
                <tr className={RowClassName(row.status)}>
                  <td style={{ color: colors.textSecondary, fontSize: 11 }}>{row.rowNumber}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td>{row.data.date}</td>
                  <td>{row.data.main_category}</td>
                  <td>{row.data.sub_category}</td>
                  <td>{row.data.description}</td>
                  <td>{row.data.amount_sar > 0 ? row.data.amount_sar.toFixed(2) : ''}</td>
                  <td>{row.data.amount_ymr > 0 ? row.data.amount_ymr.toLocaleString() : ''}</td>
                  <td>{row.data.payment_method}</td>
                  <td>{row.data.notes || ''}</td>
                </tr>
                {/* Error details row */}
                {row.errors.length > 0 && (
                  <tr className={RowClassName(row.status)}>
                    <td />
                    <td colSpan={9}>
                      <div className={styles.rowErrors}>
                        {row.errors.map((err, idx) => (
                          <div
                            key={idx}
                            className={err.severity === 'error' ? styles.rowErrorItem : styles.rowWarningItem}
                          >
                            {err.severity === 'error' ? <IoCloseCircle /> : <IoAlertCircle />}
                            <span>{t(err.message as ParseKeys)} ({err.field})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {/* Duplicate note */}
                {row.isDuplicate && (
                  <tr className={styles.rowDuplicate}>
                    <td />
                    <td colSpan={9}>
                      <div className={styles.rowWarningItem}>
                        <IoCopyOutline />
                        <span>{t('import.duplicateNote')}: {row.duplicateOf}</span>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
