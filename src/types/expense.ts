export interface Expense {
  id: string;
  date: string;
  main_category: string;
  sub_category: string;
  description: string;
  amount_sar: number;
  amount_ymr: number;
  exchange_rate: number;
  payment_method: string;
  notes: string | null;
  created_at: string;
  user_id?: string;
  tag_id?: string | null;
  _pendingSync?: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface CurrencyConfig {
  primary: Currency;
  secondary: Currency;
  exchangeRate: number;
}

export interface Tag {
  id: string;
  name: string;
  description: string | null;
  color: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  user_id?: string;
}

export interface MonthlyEstimate {
  id: string;
  main_category: string;
  sub_category: string;
  description: string;
  amount_sar: number;
  amount_ymr: number;
  notes: string | null;
  user_id?: string;
}

export interface Budget {
  id: string;
  month: number;
  year: number;
  category: string;
  amount: number;
  user_id?: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  user_id?: string;
}

export interface CategoryGroup {
  main: string;
  subs: string[];
}

export interface MonthYear {
  month: number;
  year: number;
}

export type PaymentMethod = string;
