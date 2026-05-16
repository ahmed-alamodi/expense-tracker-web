interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = '@cache_';
const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

function getItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function setItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export async function getCached<T>(key: string): Promise<{ data: T; stale: boolean } | null> {
  try {
    const raw = getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    const stale = Date.now() - entry.timestamp > DEFAULT_MAX_AGE;
    return { data: entry.data, stale };
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Cache write failure is not critical
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    removeItem(CACHE_PREFIX + key);
  } catch {
    // Ignore
  }
}

export async function invalidateCachePattern(prefix: string): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX + prefix)) {
        keys.push(key);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore
  }
}

export function expensesCacheKey(month: number, year: number): string {
  return `expenses_${year}_${month}`;
}

export function monthlyTotalCacheKey(month: number, year: number): string {
  return `monthly_total_${year}_${month}`;
}

export function yearlyTotalsCacheKey(year: number): string {
  return `yearly_totals_${year}`;
}
