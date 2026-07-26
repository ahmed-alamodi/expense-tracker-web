import { CategoryGroup, Tag } from '@/types/expense';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ExpenseInput {
  date: string;
  main_category: string;
  sub_category: string;
  description: string;
  amount_sar: number;
  amount_ymr: number;
  exchange_rate: number;
  payment_method: string;
  notes: string | null;
  tag_id?: string | null;
}

export interface ValidationContext {
  categories: CategoryGroup[];
  paymentMethods: string[];
  tags: Tag[];
}

/**
 * Validates a single expense data object against the system's categories,
 * payment methods, and tags.
 *
 * Returns an array of validation errors. An empty array means the data is valid.
 * Used by both ExpenseForm (single add) and CSV import (bulk add).
 */
export function validateExpenseData(
  data: Partial<ExpenseInput>,
  context: ValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Date validation
  if (!data.date || data.date.trim() === '') {
    errors.push({ field: 'date', message: 'validation.dateRequired', severity: 'error' });
  } else if (!isValidDate(data.date)) {
    errors.push({ field: 'date', message: 'validation.dateInvalid', severity: 'error' });
  }

  // Main category — required
  if (!data.main_category || data.main_category.trim() === '') {
    errors.push({ field: 'main_category', message: 'validation.mainCategoryRequired', severity: 'error' });
  } else {
    const mainCat = context.categories.find(c => c.main === data.main_category);
    if (!mainCat) {
      errors.push({ field: 'main_category', message: 'validation.mainCategoryUnknown', severity: 'error' });
    } else if (data.sub_category && data.sub_category.trim() !== '') {
      // Sub-category — optional but if provided must belong to main category
      if (!mainCat.subs.includes(data.sub_category)) {
        errors.push({ field: 'sub_category', message: 'validation.subCategoryInvalid', severity: 'error' });
      }
    }
  }

  // Description — required, non-empty after trim
  if (!data.description || data.description.trim() === '') {
    errors.push({ field: 'description', message: 'validation.descriptionRequired', severity: 'error' });
  }

  // Amount — at least one must be > 0
  const hasSar = typeof data.amount_sar === 'number' && data.amount_sar > 0;
  const hasYmr = typeof data.amount_ymr === 'number' && data.amount_ymr > 0;
  if (!hasSar && !hasYmr) {
    errors.push({ field: 'amount_sar', message: 'validation.amountRequired', severity: 'error' });
  } else {
    if (data.amount_sar !== undefined && data.amount_sar !== null && isNaN(data.amount_sar)) {
      errors.push({ field: 'amount_sar', message: 'validation.amountSarInvalid', severity: 'error' });
    }
    if (data.amount_ymr !== undefined && data.amount_ymr !== null && isNaN(data.amount_ymr)) {
      errors.push({ field: 'amount_ymr', message: 'validation.amountYmrInvalid', severity: 'error' });
    }
    if (typeof data.amount_sar === 'number' && data.amount_sar < 0) {
      errors.push({ field: 'amount_sar', message: 'validation.amountNegative', severity: 'error' });
    }
    if (typeof data.amount_ymr === 'number' && data.amount_ymr < 0) {
      errors.push({ field: 'amount_ymr', message: 'validation.amountNegative', severity: 'error' });
    }
  }

  // Payment method — optional, but warn if unknown
  if (data.payment_method && data.payment_method.trim() !== '') {
    if (!context.paymentMethods.includes(data.payment_method)) {
      errors.push({ field: 'payment_method', message: 'validation.paymentMethodUnknown', severity: 'warning' });
    }
  }

  // Tag — optional, warn if provided but not found
  if (data.tag_id && data.tag_id.trim() !== '') {
    const tagExists = context.tags.some(t => t.id === data.tag_id || t.name === data.tag_id);
    if (!tagExists) {
      errors.push({ field: 'tag_id', message: 'validation.tagUnknown', severity: 'warning' });
    }
  }

  return errors;
}

/**
 * Check if a data object has any blocking errors (severity === 'error').
 */
export function hasBlockingErrors(errors: ValidationError[]): boolean {
  return errors.some(e => e.severity === 'error');
}

/**
 * Validates a date string in YYYY-MM-DD format.
 */
function isValidDate(dateStr: string): boolean {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const [, yearStr, monthStr, dayStr] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // Check actual day validity via Date object
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/**
 * Attempts to normalize a date string from common formats to YYYY-MM-DD.
 * Supports: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, YYYY/MM/DD
 */
export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
    return trimmed.replace(/\//g, '-');
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = trimmed.match(/^(\d{2})[/\-.](\d{2})[/\-.](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    // Heuristic: if first number > 12, it's DD/MM/YYYY
    // If second number > 12, it's MM/DD/YYYY
    // Otherwise assume DD/MM/YYYY (more common in Arabic world)
    const first = parseInt(d, 10);
    const second = parseInt(m, 10);
    if (first > 12 && second <= 12) {
      // DD/MM/YYYY
      return `${y}-${m}-${d}`;
    } else if (second > 12 && first <= 12) {
      // MM/DD/YYYY
      return `${y}-${d}-${m}`;
    } else {
      // Ambiguous — default to DD/MM/YYYY
      return `${y}-${m}-${d}`;
    }
  }

  return trimmed;
}

/**
 * Convert Arabic/Hindi numerals (٠١٢٣٤٥٦٧٨٩) to Latin digits (0123456789).
 */
export function normalizeArabicDigits(str: string): string {
  return str
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

/**
 * Sanitize a CSV cell value to prevent CSV injection.
 * Strips leading =, +, -, @ characters.
 */
export function sanitizeCsvValue(value: string): string {
  if (!value) return value;
  return value.replace(/^[=+\-@]+/, '');
}

/**
 * Parse a numeric string, handling currency symbols and whitespace.
 */
export function parseAmount(value: string | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  // Normalize Arabic digits
  let cleaned = normalizeArabicDigits(String(value));
  // Remove currency symbols, whitespace, commas
  cleaned = cleaned.replace(/[^\d.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
