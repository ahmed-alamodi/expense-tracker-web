'use client';

import { useState, useEffect, useCallback } from 'react';
import { Expense } from '@/types/expense';
import { isConfigured } from '@/lib/supabase';
import * as db from '@/lib/database';
import { getCached, setCache, expensesCacheKey, monthlyTotalCacheKey } from '@/lib/cache';

export function useExpenses(filters?: {
  month?: number;
  year?: number;
  mainCategory?: string;
  paymentMethod?: string;
  search?: string;
  limit?: number;
}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      setError('Supabase غير مُعَدّ');
      return;
    }

    const cacheKey = filters?.month && filters?.year
      ? expensesCacheKey(filters.month, filters.year)
      : null;

    if (cacheKey && !filters?.mainCategory && !filters?.paymentMethod && !filters?.search) {
      const cached = await getCached<Expense[]>(cacheKey);
      if (cached) {
        setExpenses(cached.data);
        setLoading(false);
        if (!cached.stale) return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      const data = await db.getExpenses(filters);
      setExpenses(data);

      if (cacheKey && !filters?.mainCategory && !filters?.paymentMethod && !filters?.search) {
        await setCache(cacheKey, data);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, [
    filters?.month,
    filters?.year,
    filters?.mainCategory,
    filters?.paymentMethod,
    filters?.search,
    filters?.limit,
  ]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, error, refresh: fetchExpenses };
}

export function useMonthlyTotal(month: number, year: number) {
  const [data, setData] = useState<{
    totalSar: number;
    totalYmr: number;
    byCategory: Record<string, { sar: number; ymr: number; count: number }>;
  }>({ totalSar: 0, totalYmr: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    const cacheKey = monthlyTotalCacheKey(month, year);
    const cached = await getCached<typeof data>(cacheKey);
    if (cached) {
      setData(cached.data);
      setLoading(false);
      if (!cached.stale) return;
    }

    try {
      setLoading(true);
      const result = await db.getMonthlyTotal(month, year);
      setData(result);
      await setCache(cacheKey, result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, loading, refresh: fetchData };
}
