import { Expense, CategoryGroup, Tag } from '@/types/expense';
import {
  validateExpenseData,
  ValidationError,
  ValidationContext,
  hasBlockingErrors,
  normalizeDateString,
  normalizeArabicDigits,
  sanitizeCsvValue,
  parseAmount,
} from './expense-validation';
import { sarToYmr, ymrToSar } from './storage';
import { createExpenses } from './database';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface ParsedRow {
  rowNumber: number;
  raw: Record<string, string>;
  data: Omit<Expense, 'id' | 'created_at' | 'user_id'>;
  errors: ValidationError[];
  isDuplicate: boolean;
  duplicateOf?: string; // description of duplicate match
  status: 'valid' | 'warning' | 'error' | 'duplicate';
}

export interface CsvParseResult {
  rows: ParsedRow[];
  fileErrors: string[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  duplicateRows: number;
}

export interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ rowNumber: number; error: string }>;
}

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_ROWS = 500;
const BULK_CHUNK_SIZE = 50;

// Column name mappings (EN → AR)
const COLUMN_MAP: Record<string, string> = {
  date: 'التاريخ',
  main_category: 'الفئة الرئيسية',
  sub_category: 'الفئة الفرعية',
  description: 'الوصف',
  amount_sar: 'المبلغ بالسعودي',
  amount_ymr: 'المبلغ باليمني',
  payment_method: 'طريقة الدفع',
  notes: 'ملاحظات',
  tag: 'التصنيف',
};

// Reverse mapping (AR → EN key)
const REVERSE_COLUMN_MAP: Record<string, string> = {};
for (const [en, ar] of Object.entries(COLUMN_MAP)) {
  REVERSE_COLUMN_MAP[ar] = en;
  REVERSE_COLUMN_MAP[en] = en; // also map EN to itself
}

const REQUIRED_COLUMNS = ['date', 'main_category', 'description'];
const ALL_COLUMNS = Object.keys(COLUMN_MAP);

// ────────────────────────────────────────────────────────────────
// CSV Template Generation
// ────────────────────────────────────────────────────────────────

export function generateCsvTemplate(
  categories: CategoryGroup[],
  paymentMethods: string[],
  tags: Tag[],
  language: 'ar' | 'en' = 'ar'
): string {
  const isAr = language === 'ar';
  const headers = ALL_COLUMNS.map(col => isAr ? COLUMN_MAP[col] : col);

  // Build 2-3 example rows using real categories/payment methods
  const exampleRows: string[][] = [];
  const firstCat = categories[0];
  const firstPayment = paymentMethods[0] || '';

  if (firstCat) {
    const firstSub = firstCat.subs[0] || '';
    exampleRows.push([
      '2025-07-01',
      firstCat.main,
      firstSub,
      isAr ? 'وجبة عشاء' : 'Dinner',
      '50',
      '',
      firstPayment,
      '',
      '',
    ]);
  }

  const secondCat = categories.length > 1 ? categories[1] : categories[0];
  if (secondCat) {
    exampleRows.push([
      '2025-07-02',
      secondCat.main,
      secondCat.subs[0] || '',
      isAr ? 'مشتريات منزلية' : 'Home supplies',
      '120',
      '',
      paymentMethods[1] || firstPayment,
      isAr ? 'ملاحظة تجريبية' : 'Test note',
      tags.length > 0 ? tags[0].name : '',
    ]);
  }

  const csvRows = [
    headers.join(','),
    ...exampleRows.map(row => row.map(escapeCsvField).join(',')),
  ];

  // Add BOM for proper Arabic display in Excel
  return '\uFEFF' + csvRows.join('\n');
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ────────────────────────────────────────────────────────────────
// CSV Parsing
// ────────────────────────────────────────────────────────────────

/**
 * Validate the file before parsing.
 */
export function validateFile(file: File): string[] {
  const errors: string[] = [];

  if (!file.name.toLowerCase().endsWith('.csv')) {
    errors.push('import.errorNotCsv');
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push('import.errorTooLarge');
  }

  if (file.size === 0) {
    errors.push('import.errorEmpty');
  }

  return errors;
}

/**
 * Parse CSV text into rows of key-value objects.
 */
export function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[]; errors: string[] } {
  const errors: string[] = [];

  // Strip BOM
  let cleaned = text.replace(/^\uFEFF/, '');

  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into lines
  const lines = cleaned.split('\n').filter(line => line.trim() !== '');

  if (lines.length === 0) {
    errors.push('import.errorEmpty');
    return { headers: [], rows: [], errors };
  }

  // Parse header row
  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map(h => {
    const trimmed = h.trim();
    // Normalize to internal key
    return REVERSE_COLUMN_MAP[trimmed] || trimmed;
  });

  // Check required columns
  const missingRequired = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missingRequired.length > 0) {
    errors.push('import.errorMissingColumns');
  }

  if (lines.length < 2) {
    errors.push('import.errorNoData');
    return { headers, rows: [], errors };
  }

  if (lines.length - 1 > MAX_ROWS) {
    errors.push('import.errorTooManyRows');
  }

  // Parse data rows
  const dataRows: Record<string, string>[] = [];
  const rowCount = Math.min(lines.length - 1, MAX_ROWS);

  for (let i = 1; i <= rowCount; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const val = values[j] || '';
      // Normalize Arabic digits and sanitize
      row[headers[j]] = sanitizeCsvValue(normalizeArabicDigits(val.trim()));
    }
    dataRows.push(row);
  }

  return { headers, rows: dataRows, errors };
}

/**
 * Parse a single CSV line, handling quoted fields with commas.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current);
  return fields;
}

// ────────────────────────────────────────────────────────────────
// Row Validation + Transformation
// ────────────────────────────────────────────────────────────────

export function processRows(
  rawRows: Record<string, string>[],
  context: ValidationContext,
  exchangeRate: number,
  existingExpenses: Expense[]
): CsvParseResult {
  const rows: ParsedRow[] = [];
  const fileErrors: string[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const rowNumber = i + 2; // +2 because row 1 is header, data starts at 2

    // Transform raw values → typed data
    const date = normalizeDateString(raw.date || '');
    const amountSar = parseAmount(raw.amount_sar);
    const amountYmr = parseAmount(raw.amount_ymr);

    // Auto-calculate missing amounts using current exchange rate
    let finalSar = amountSar;
    let finalYmr = amountYmr;
    if (finalSar > 0 && finalYmr <= 0) {
      finalYmr = sarToYmr(finalSar, exchangeRate);
    } else if (finalYmr > 0 && finalSar <= 0) {
      finalSar = ymrToSar(finalYmr, exchangeRate);
    } else if (finalSar > 0 && finalYmr > 0) {
      // Both provided — recalculate using current exchange rate
      finalYmr = sarToYmr(finalSar, exchangeRate);
    }

    // Resolve tag name → tag ID
    let tagId: string | null = null;
    const tagValue = raw.tag || '';
    if (tagValue) {
      const matchedTag = context.tags.find(
        t => t.name === tagValue || t.id === tagValue
      );
      if (matchedTag) {
        tagId = matchedTag.id;
      }
      // If not found, tagId stays null — warning will be added by validator
    }

    const data: Omit<Expense, 'id' | 'created_at' | 'user_id'> = {
      date,
      main_category: (raw.main_category || '').trim(),
      sub_category: (raw.sub_category || '').trim(),
      description: (raw.description || '').trim(),
      amount_sar: finalSar,
      amount_ymr: finalYmr,
      exchange_rate: exchangeRate,
      payment_method: (raw.payment_method || '').trim(),
      notes: (raw.notes || '').trim() || null,
      tag_id: tagId,
    };

    // Validate
    const errors = validateExpenseData(data, context);

    // If tag was provided but not found, add warning
    if (tagValue && !tagId) {
      const hasTagWarning = errors.some(e => e.field === 'tag_id');
      if (!hasTagWarning) {
        errors.push({ field: 'tag_id', message: 'validation.tagUnknown', severity: 'warning' });
      }
    }

    // Check for duplicates against existing expenses
    const isDuplicate = existingExpenses.some(
      e =>
        e.date === data.date &&
        e.main_category === data.main_category &&
        e.description.trim().toLowerCase() === data.description.trim().toLowerCase() &&
        Math.abs(e.amount_sar - data.amount_sar) < 0.01
    );

    // Determine row status
    let status: ParsedRow['status'] = 'valid';
    if (hasBlockingErrors(errors)) {
      status = 'error';
    } else if (isDuplicate) {
      status = 'duplicate';
    } else if (errors.length > 0) {
      status = 'warning';
    }

    rows.push({
      rowNumber,
      raw,
      data,
      errors,
      isDuplicate,
      duplicateOf: isDuplicate ? `${data.date} - ${data.description}` : undefined,
      status,
    });
  }

  return {
    rows,
    fileErrors,
    totalRows: rows.length,
    validRows: rows.filter(r => r.status === 'valid' || r.status === 'warning').length,
    errorRows: rows.filter(r => r.status === 'error').length,
    warningRows: rows.filter(r => r.status === 'warning').length,
    duplicateRows: rows.filter(r => r.status === 'duplicate').length,
  };
}

// ────────────────────────────────────────────────────────────────
// Bulk Import
// ────────────────────────────────────────────────────────────────

export async function importExpenses(
  rows: ParsedRow[],
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult> {
  const importableRows = rows.filter(
    r => r.status === 'valid' || r.status === 'warning'
  );

  const result: ImportResult = {
    total: rows.length,
    successful: 0,
    failed: 0,
    skipped: rows.length - importableRows.length,
    errors: [],
  };

  if (importableRows.length === 0) {
    onProgress?.(result.total, result.total);
    return result;
  }

  // Insert all expenses in bulk (single API call)
  try {
    const expensesToInsert = importableRows.map(r => r.data);
    await createExpenses(expensesToInsert);
    result.successful = importableRows.length;
  } catch (err: any) {
    result.failed = importableRows.length;
    importableRows.forEach(row => {
      result.errors.push({
        rowNumber: row.rowNumber,
        error: err.message || 'فشلت عملية الإدخال الجماعي',
      });
    });
  }

  onProgress?.(result.total, result.total);
  return result;
}

// ────────────────────────────────────────────────────────────────
// Payment Method Auto-Creation
// ────────────────────────────────────────────────────────────────

/**
 * Finds payment methods in the parsed rows that don't exist in the system
 * and creates them automatically.
 */
export async function autoCreatePaymentMethods(
  rows: ParsedRow[],
  existingMethods: string[],
  addPaymentMethod: (method: string) => Promise<void>
): Promise<string[]> {
  const newMethods = new Set<string>();

  for (const row of rows) {
    const pm = row.data.payment_method;
    if (pm && pm.trim() !== '' && !existingMethods.includes(pm) && !newMethods.has(pm)) {
      newMethods.add(pm);
    }
  }

  const created: string[] = [];
  for (const method of newMethods) {
    try {
      await addPaymentMethod(method);
      created.push(method);
    } catch {
      // Silently skip — payment method creation failure is non-critical
    }
  }

  return created;
}

/**
 * Read a File object as text.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}
