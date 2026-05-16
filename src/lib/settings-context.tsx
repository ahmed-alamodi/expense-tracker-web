'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CategoryGroup, CurrencyConfig } from '@/types/expense';
import {
  getExchangeRate, setExchangeRate as persistExchangeRate,
  getPaymentMethods, setPaymentMethods as persistPaymentMethods,
  getCategories, setCategories as persistCategories,
  getCurrencyConfig, setCurrencyConfig as persistCurrencyConfig,
} from './storage';
import { isConfigured } from './supabase';
import { getRemoteCategories, syncCategoriesToRemote } from './database';
import { DEFAULT_CURRENCY_CONFIG } from '@/constants/categories';

interface SettingsContextType {
  exchangeRate: number;
  paymentMethods: string[];
  categories: CategoryGroup[];
  currencyConfig: CurrencyConfig;
  ready: boolean;
  updateExchangeRate: (rate: number) => Promise<void>;
  updatePaymentMethods: (methods: string[]) => Promise<void>;
  updateCategories: (cats: CategoryGroup[]) => Promise<void>;
  updateCurrencyConfig: (config: CurrencyConfig) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  exchangeRate: 410,
  paymentMethods: [],
  categories: [],
  currencyConfig: DEFAULT_CURRENCY_CONFIG,
  ready: false,
  updateExchangeRate: async () => {},
  updatePaymentMethods: async () => {},
  updateCategories: async () => {},
  updateCurrencyConfig: async () => {},
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [exchangeRate, setExchangeRateState] = useState(410);
  const [paymentMethods, setPaymentMethodsState] = useState<string[]>([]);
  const [categories, setCategoriesState] = useState<CategoryGroup[]>([]);
  const [currencyConfig, setCurrencyConfigState] = useState<CurrencyConfig>(DEFAULT_CURRENCY_CONFIG);
  const [ready, setReady] = useState(false);

  const loadAll = useCallback(async () => {
    const [rate, methods, localCats, config] = await Promise.all([
      getExchangeRate(),
      getPaymentMethods(),
      getCategories(),
      getCurrencyConfig(),
    ]);
    setExchangeRateState(rate);
    setPaymentMethodsState(methods);
    setCategoriesState(localCats);
    setCurrencyConfigState(config);
    setReady(true);

    if (isConfigured) {
      try {
        const remoteCats = await getRemoteCategories();
        if (remoteCats.length > 0) {
          const merged: CategoryGroup[] = remoteCats.map(r => ({
            main: r.main_category,
            subs: r.sub_categories,
          }));
          setCategoriesState(merged);
          await persistCategories(merged);
        } else if (localCats.length > 0) {
          await syncCategoriesToRemote(localCats);
        }
      } catch {
        // Use local categories on sync failure
      }
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const updateExchangeRate = useCallback(async (rate: number) => {
    setExchangeRateState(rate);
    await persistExchangeRate(rate);
  }, []);

  const updatePaymentMethods = useCallback(async (methods: string[]) => {
    setPaymentMethodsState(methods);
    await persistPaymentMethods(methods);
  }, []);

  const updateCategories = useCallback(async (cats: CategoryGroup[]) => {
    setCategoriesState(cats);
    await persistCategories(cats);
    if (isConfigured) {
      try {
        await syncCategoriesToRemote(cats);
      } catch {
        // Will sync later
      }
    }
  }, []);

  const updateCurrencyConfig = useCallback(async (config: CurrencyConfig) => {
    setCurrencyConfigState(config);
    setExchangeRateState(config.exchangeRate);
    await persistCurrencyConfig(config);
    await persistExchangeRate(config.exchangeRate);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        exchangeRate,
        paymentMethods,
        categories,
        currencyConfig,
        ready,
        updateExchangeRate,
        updatePaymentMethods,
        updateCategories,
        updateCurrencyConfig,
        refreshSettings: loadAll,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
