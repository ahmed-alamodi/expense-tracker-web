'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ParseKeys } from 'i18next';
import { useRouter } from 'next/navigation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSettings } from '@/lib/settings-context';
import { useNetwork } from '@/lib/network-context';
import { getTags, getExpenses } from '@/lib/database';
import { invalidateCachePattern } from '@/lib/cache';
import { Tag, Expense } from '@/types/expense';
import {
  validateFile,
  readFileAsText,
  parseCsvText,
  processRows,
  generateCsvTemplate,
  importExpenses,
  autoCreatePaymentMethods,
  CsvParseResult,
  ImportResult,
} from '@/lib/csv-import';
import CsvDropZone from '@/components/CsvImport/CsvDropZone';
import CsvPreviewTable from '@/components/CsvImport/CsvPreviewTable';
import CsvImportSummary from '@/components/CsvImport/CsvImportSummary';
import {
  IoArrowBack, IoCloudOfflineOutline,
  IoDownloadOutline, IoAlertCircle, IoCloudUploadOutline,
} from 'react-icons/io5';
import styles from '@/components/CsvImport/CsvImport.module.css';

type Stage = 'upload' | 'preview' | 'importing' | 'summary';

export default function ImportPage() {
  const { t } = useTranslation();
  const colors = useThemeColor();
  const router = useRouter();
  const { isOnline } = useNetwork();
  const { categories, paymentMethods, exchangeRate, addPaymentMethod } = useSettings();

  const [stage, setStage] = useState<Stage>('upload');
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [newPaymentMethods, setNewPaymentMethods] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  // ── Handle file selected ──
  const handleFileSelected = useCallback(async (file: File) => {
    setFileErrors([]);
    setParseResult(null);

    // Validate file
    const fileErrs = validateFile(file);
    if (fileErrs.length > 0) {
      setFileErrors(fileErrs);
      return;
    }

    setLoading(true);
    try {
      // Read file
      const text = await readFileAsText(file);

      // Parse CSV
      const { headers, rows: rawRows, errors: parseErrors } = parseCsvText(text);
      if (parseErrors.length > 0) {
        setFileErrors(parseErrors);
        setLoading(false);
        return;
      }

      // Load tags and existing expenses for validation
      let tags: Tag[] = [];
      let existingExpenses: Expense[] = [];
      try {
        tags = await getTags();
      } catch { /* Tags fetch failure is non-critical */ }

      // Load existing expenses for duplicate detection (for the date range in CSV)
      try {
        const dates = rawRows
          .map(r => r.date)
          .filter(Boolean)
          .sort();
        if (dates.length > 0) {
          existingExpenses = await getExpenses({
            startDate: dates[0],
            endDate: dates[dates.length - 1],
          });
        }
      } catch { /* Duplicate check failure is non-critical */ }

      // Process and validate all rows
      const context = { categories, paymentMethods, tags };
      const result = processRows(rawRows, context, exchangeRate, existingExpenses);

      setParseResult(result);
      setStage('preview');
    } catch (err: any) {
      setFileErrors(['import.errorParsingFailed']);
    } finally {
      setLoading(false);
    }
  }, [categories, paymentMethods, exchangeRate]);

  // ── Handle import ──
  const handleImport = useCallback(async (includeDuplicates: boolean) => {
    if (!parseResult) return;

    setStage('importing');
    setProgress({ current: 0, total: parseResult.totalRows });

    try {
      // Auto-create new payment methods
      const newMethods = await autoCreatePaymentMethods(
        parseResult.rows.filter(r => r.status === 'valid' || r.status === 'warning' || (includeDuplicates && r.status === 'duplicate')),
        paymentMethods,
        addPaymentMethod
      );
      setNewPaymentMethods(newMethods);

      // Determine which rows to import
      const rowsToImport = parseResult.rows.filter(r => {
        if (r.status === 'valid' || r.status === 'warning') return true;
        if (r.status === 'duplicate' && includeDuplicates) return true;
        return false;
      });

      // Perform import
      const result = await importExpenses(
        rowsToImport,
        (current, total) => setProgress({ current, total })
      );

      // Adjust total/skipped to reflect the full CSV
      result.total = parseResult.totalRows;
      result.skipped = parseResult.totalRows - result.successful - result.failed;

      setImportResult(result);
      setStage('summary');

      // Invalidate caches
      await invalidateCachePattern('expenses_');
      await invalidateCachePattern('monthly_total_');
      await invalidateCachePattern('yearly_totals_');
    } catch (err: any) {
      setFileErrors(['import.errorImportFailed']);
      setStage('preview');
    }
  }, [parseResult, paymentMethods, addPaymentMethod]);

  // ── Handle template download ──
  const handleDownloadTemplate = useCallback(async () => {
    let tags: Tag[] = [];
    try { tags = await getTags(); } catch { /* non-critical */ }

    const language = (document.documentElement.lang === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
    const csv = generateCsvTemplate(categories, paymentMethods, tags, language);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_template_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [categories, paymentMethods]);

  // ── Reset to upload state ──
  const handleReset = () => {
    setStage('upload');
    setFileErrors([]);
    setParseResult(null);
    setImportResult(null);
    setNewPaymentMethods([]);
    setProgress({ current: 0, total: 0 });
  };

  // ── Offline guard ──
  if (!isOnline) {
    return (
      <>
        <div className="page-header">
          <button className="icon-btn" onClick={() => router.back()}><IoArrowBack /></button>
          <h1>{t('import.title')}</h1>
          <div style={{ width: 32 }} />
        </div>
        <div className="status-banner" style={{ background: colors.warning + '20', color: colors.warning }}>
          <IoCloudOfflineOutline />
          <span>{t('import.offlineMessage')}</span>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <button className="icon-btn" onClick={() => router.back()}><IoArrowBack /></button>
        <h1>{t('import.title')}</h1>
        <div style={{ width: 32 }} />
      </div>

      {/* Stage: Upload */}
      {stage === 'upload' && (
        <div style={{ padding: '16px' }}>
          {/* Template download */}
          <div className={styles.templateSection} onClick={handleDownloadTemplate}>
            <IoDownloadOutline className={styles.templateIcon} />
            <div className={styles.templateText}>
              <div className={styles.templateTitle}>{t('import.downloadTemplate')}</div>
              <div className={styles.templateDesc}>{t('import.downloadTemplateDesc')}</div>
            </div>
          </div>

          {/* Drop zone */}
          <div style={{ marginTop: 16 }}>
            <CsvDropZone onFileSelected={handleFileSelected} disabled={loading} />
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div className="spinner" style={{ minHeight: 60 }} />
              <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>
                {t('import.parsing')}
              </div>
            </div>
          )}

          {/* File errors */}
          {fileErrors.map((err, idx) => (
            <div key={idx} className={styles.fileError}>
              <IoAlertCircle className={styles.fileErrorIcon} />
              <span>{t(err as ParseKeys)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stage: Preview */}
      {stage === 'preview' && parseResult && (
        <>
          <CsvPreviewTable result={parseResult} />

          {/* New payment methods notice */}
          {(() => {
            const unknownMethods = new Set<string>();
            parseResult.rows.forEach(r => {
              const pm = r.data.payment_method;
              if (pm && !paymentMethods.includes(pm)) unknownMethods.add(pm);
            });
            if (unknownMethods.size === 0) return null;
            return (
              <div className={styles.newMethodsNotice}>
                <IoAlertCircle className={styles.newMethodsIcon} />
                <div>
                  <strong>{t('import.newMethodsWillCreate')}:</strong>{' '}
                  {Array.from(unknownMethods).join('، ')}
                </div>
              </div>
            );
          })()}

          {/* Action buttons */}
          <div className={styles.importActions}>
            <button className="btn btn-outline" onClick={handleReset}>
              {t('import.reUpload')}
            </button>

            {parseResult.validRows > 0 && (
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => handleImport(false)}
              >
                <IoCloudUploadOutline />
                {parseResult.errorRows > 0 || parseResult.duplicateRows > 0
                  ? t('import.importValidOnly', { count: parseResult.validRows })
                  : t('import.importAll', { count: parseResult.validRows })
                }
              </button>
            )}

            {parseResult.duplicateRows > 0 && parseResult.validRows > 0 && (
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => handleImport(true)}
              >
                {t('import.importWithDuplicates', { count: parseResult.validRows + parseResult.duplicateRows })}
              </button>
            )}

            {parseResult.validRows === 0 && (
              <div style={{ flex: 1, textAlign: 'center', padding: 12, color: colors.danger, fontSize: 14, fontWeight: 600 }}>
                {t('import.noValidRows')}
              </div>
            )}
          </div>
        </>
      )}

      {/* Stage: Importing */}
      {stage === 'importing' && (
        <div className={styles.progressContainer}>
          <div className={styles.progressLabel}>{t('import.importing')}</div>
          <div className={styles.progressBarOuter}>
            <div
              className={styles.progressBarInner}
              style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
            />
          </div>
          <div className={styles.progressCount}>
            {progress.current} / {progress.total}
          </div>
        </div>
      )}

      {/* Stage: Summary */}
      {stage === 'summary' && importResult && (
        <CsvImportSummary
          result={importResult}
          newPaymentMethods={newPaymentMethods}
          onDone={handleReset}
        />
      )}
    </>
  );
}
