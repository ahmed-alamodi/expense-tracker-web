import { DEFAULT_EXCHANGE_RATE, DEFAULT_PAYMENT_METHODS, DEFAULT_CATEGORIES, DEFAULT_CURRENCY_CONFIG } from '@/constants/categories';
import { CategoryGroup, CurrencyConfig } from '@/types/expense';

function getItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function setItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

const KEYS = {
  EXCHANGE_RATE: '@exchange_rate',
  PAYMENT_METHODS: '@payment_methods',
  CATEGORIES: '@categories',
  CURRENCY_CONFIG: '@currency_config',
};

export async function getExchangeRate(): Promise<number> {
  try {
    const val = getItem(KEYS.EXCHANGE_RATE);
    return val ? parseFloat(val) : DEFAULT_EXCHANGE_RATE;
  } catch {
    return DEFAULT_EXCHANGE_RATE;
  }
}

export async function setExchangeRate(rate: number): Promise<void> {
  setItem(KEYS.EXCHANGE_RATE, rate.toString());
}

export async function getPaymentMethods(): Promise<string[]> {
  try {
    const val = getItem(KEYS.PAYMENT_METHODS);
    return val ? JSON.parse(val) : DEFAULT_PAYMENT_METHODS;
  } catch {
    return DEFAULT_PAYMENT_METHODS;
  }
}

export async function setPaymentMethods(methods: string[]): Promise<void> {
  setItem(KEYS.PAYMENT_METHODS, JSON.stringify(methods));
}

export function sarToYmr(sar: number, rate: number): number {
  return Math.round(sar * rate);
}

export function ymrToSar(ymr: number, rate: number): number {
  return parseFloat((ymr / rate).toFixed(2));
}

export async function getCategories(): Promise<CategoryGroup[]> {
  try {
    const val = getItem(KEYS.CATEGORIES);
    return val ? JSON.parse(val) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function setCategories(categories: CategoryGroup[]): Promise<void> {
  setItem(KEYS.CATEGORIES, JSON.stringify(categories));
}

export async function getCurrencyConfig(): Promise<CurrencyConfig> {
  try {
    const val = getItem(KEYS.CURRENCY_CONFIG);
    if (val) {
      const config = JSON.parse(val);
      return {
        ...DEFAULT_CURRENCY_CONFIG,
        ...config,
        primary: { ...DEFAULT_CURRENCY_CONFIG.primary, ...config.primary },
        secondary: { ...DEFAULT_CURRENCY_CONFIG.secondary, ...config.secondary },
      };
    }
    return DEFAULT_CURRENCY_CONFIG;
  } catch {
    return DEFAULT_CURRENCY_CONFIG;
  }
}

export async function setCurrencyConfig(config: CurrencyConfig): Promise<void> {
  setItem(KEYS.CURRENCY_CONFIG, JSON.stringify(config));
}
