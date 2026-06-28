import { supabase, isConfigured } from './supabase';
import { Expense, Budget, MonthlyEstimate, Tag, CategoryGroup, Debt } from '@/types/expense';

function checkConfigured() {
  if (!isConfigured) {
    throw new Error('Supabase غير مُعَدّ. عدّل ملف lib/supabase.ts');
  }
}

export async function getExpenses(filters?: {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  mainCategory?: string;
  paymentMethod?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (filters?.startDate || filters?.endDate) {
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
  } else if (filters?.month && filters?.year) {
    const startDate = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
    const endMonth = filters.month === 12 ? 1 : filters.month + 1;
    const endYear = filters.month === 12 ? filters.year + 1 : filters.year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
    query = query.gte('date', startDate).lt('date', endDate);
  } else if (filters?.year) {
    query = query.gte('date', `${filters.year}-01-01`).lt('date', `${filters.year + 1}-01-01`);
  }

  if (filters?.mainCategory) {
    query = query.eq('main_category', filters.mainCategory);
  }
  if (filters?.paymentMethod) {
    query = query.eq('payment_method', filters.paymentMethod);
  }
  if (filters?.search) {
    query = query.or(
      `description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
    );
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters?.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Expense[];
}

export async function getExpenseById(id: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>) {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expense)
    .select()
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(id: string, expense: Partial<Expense>) {
  const { data, error } = await supabase
    .from('expenses')
    .update(expense)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function getMonthlyTotal(month: number, year: number, startDate?: string, endDate?: string) {
  let query = supabase
    .from('expenses')
    .select('amount_sar, amount_ymr, main_category');

  if (startDate || endDate) {
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
  } else {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
    query = query.gte('date', start).lt('date', end);
  }

  const { data, error } = await query;
  if (error) throw error;

  const totalSar = (data || []).reduce((sum, e) => sum + (e.amount_sar || 0), 0);
  const totalYmr = (data || []).reduce((sum, e) => sum + (e.amount_ymr || 0), 0);

  const byCategory: Record<string, { sar: number; ymr: number; count: number }> = {};
  for (const e of data || []) {
    const cat = e.main_category || 'أخرى';
    if (!byCategory[cat]) byCategory[cat] = { sar: 0, ymr: 0, count: 0 };
    byCategory[cat].sar += e.amount_sar || 0;
    byCategory[cat].ymr += e.amount_ymr || 0;
    byCategory[cat].count += 1;
  }

  return { totalSar, totalYmr, byCategory, expenses: data || [] };
}

export async function getMonthlyTotals(year: number) {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount_sar, date')
    .gte('date', `${year}-01-01`)
    .lt('date', `${year + 1}-01-01`);

  if (error) throw error;

  const monthly: number[] = Array(12).fill(0);
  for (const e of data || []) {
    const month = new Date(e.date).getMonth();
    monthly[month] += e.amount_sar || 0;
  }
  return monthly;
}

// Budget functions
export async function getBudgets(month: number, year: number) {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('month', month)
    .eq('year', year);
  if (error) throw error;
  return data as Budget[];
}

export async function upsertBudget(budget: Omit<Budget, 'id' | 'user_id'>) {
  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('month', budget.month)
    .eq('year', budget.year)
    .eq('category', budget.category)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('budgets')
      .update({ amount: budget.amount })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as Budget;
  } else {
    const { data, error } = await supabase
      .from('budgets')
      .insert(budget)
      .select()
      .single();
    if (error) throw error;
    return data as Budget;
  }
}

export async function deleteBudget(id: string) {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

// Monthly Estimates functions
export async function getMonthlyEstimates() {
  const { data, error } = await supabase
    .from('monthly_estimates')
    .select('*')
    .order('main_category', { ascending: true });
  if (error) throw error;
  return data as MonthlyEstimate[];
}

export async function createMonthlyEstimate(estimate: Omit<MonthlyEstimate, 'id' | 'user_id'>) {
  const { data, error } = await supabase
    .from('monthly_estimates')
    .insert(estimate)
    .select()
    .single();
  if (error) throw error;
  return data as MonthlyEstimate;
}

export async function updateMonthlyEstimate(id: string, estimate: Partial<MonthlyEstimate>) {
  const { data, error } = await supabase
    .from('monthly_estimates')
    .update(estimate)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MonthlyEstimate;
}

export async function deleteMonthlyEstimate(id: string) {
  const { error } = await supabase.from('monthly_estimates').delete().eq('id', id);
  if (error) throw error;
}

// Categories functions
export async function getRemoteCategories(): Promise<{ id: string; main_category: string; sub_categories: string[]; sort_order: number }[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function syncCategoriesToRemote(categories: CategoryGroup[]): Promise<void> {
  const { data: existing } = await supabase
    .from('categories')
    .select('id');

  if (existing && existing.length > 0) {
    const ids = existing.map(e => e.id);
    await supabase.from('categories').delete().in('id', ids);
  }

  if (categories.length > 0) {
    const rows = categories.map((cat, idx) => ({
      main_category: cat.main,
      sub_categories: cat.subs,
      sort_order: idx,
    }));
    const { error } = await supabase.from('categories').insert(rows);
    if (error) throw error;
  }
}

// Payment Methods functions
export async function getRemotePaymentMethods(): Promise<string[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('name')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data?.map(m => m.name) || [];
}

export async function syncPaymentMethodsToRemote(methods: string[]): Promise<void> {
  const { data: existing, error: fetchErr } = await supabase.from('payment_methods').select('id, name');
  if (fetchErr) throw fetchErr;

  const existingMap = new Map((existing || []).map(e => [e.name, e.id]));
  const newNames = new Set(methods);

  const toDeleteIds = (existing || []).filter(e => !newNames.has(e.name)).map(e => e.id);
  if (toDeleteIds.length > 0) {
    const { error } = await supabase.from('payment_methods').delete().in('id', toDeleteIds);
    if (error) throw error;
  }

  const toInsert = methods.filter(m => !existingMap.has(m)).map((m, idx) => ({ name: m, sort_order: idx }));
  if (toInsert.length > 0) {
    const { error } = await supabase.from('payment_methods').insert(toInsert);
    if (error) throw error;
  }

  const toUpdate = methods.filter(m => existingMap.has(m)).map((m, idx) => ({ id: existingMap.get(m)!, sort_order: idx }));
  for (const item of toUpdate) {
    await supabase.from('payment_methods').update({ sort_order: item.sort_order }).eq('id', item.id);
  }
}

export async function addRemotePaymentMethod(name: string, sortOrder: number): Promise<void> {
  const { error } = await supabase.from('payment_methods').insert({ name, sort_order: sortOrder });
  if (error) throw error;
}

export async function deleteRemotePaymentMethod(name: string): Promise<void> {
  const { error } = await supabase.from('payment_methods').delete().eq('name', name);
  if (error) throw error;
}

// Tags functions
export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Tag[];
}

export async function createTag(tag: Omit<Tag, 'id' | 'user_id'>): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .insert(tag)
    .select()
    .single();
  if (error) throw error;
  return data as Tag;
}

export async function updateTag(id: string, tag: Partial<Tag>): Promise<Tag> {
  const { data, error } = await supabase
    .from('tags')
    .update(tag)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Tag;
}

export async function deleteTag(id: string): Promise<void> {
  await supabase.from('expenses').update({ tag_id: null }).eq('tag_id', id);
  const { error } = await supabase.from('tags').delete().eq('id', id);
  if (error) throw error;
}

export async function getExpensesByTag(tagId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('tag_id', tagId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data as Expense[];
}

export async function getTagStats(tagId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount_sar, amount_ymr, main_category')
    .eq('tag_id', tagId);
  if (error) throw error;

  const expenses = data || [];
  const totalSar = expenses.reduce((sum, e) => sum + (e.amount_sar || 0), 0);
  const totalYmr = expenses.reduce((sum, e) => sum + (e.amount_ymr || 0), 0);

  const byCategory: Record<string, { sar: number; ymr: number; count: number }> = {};
  for (const e of expenses) {
    const cat = e.main_category || 'أخرى';
    if (!byCategory[cat]) byCategory[cat] = { sar: 0, ymr: 0, count: 0 };
    byCategory[cat].sar += e.amount_sar || 0;
    byCategory[cat].ymr += e.amount_ymr || 0;
    byCategory[cat].count += 1;
  }

  return { totalSar, totalYmr, byCategory, count: expenses.length };
}

// Debts functions
export async function getDebts(): Promise<Debt[]> {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Debt[];
}

export async function createDebt(debt: Omit<Debt, 'id' | 'user_id' | 'created_at'>): Promise<Debt> {
  const { data, error } = await supabase
    .from('debts')
    .insert(debt)
    .select()
    .single();
  if (error) throw error;
  return data as Debt;
}

export async function updateDebt(id: string, debt: Partial<Debt>): Promise<Debt> {
  const { data, error } = await supabase
    .from('debts')
    .update(debt)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Debt;
}

export async function payDebtInstallment(
  debtId: string,
  amountSar: number,
  amountYmr: number,
  expenseData: Omit<Expense, 'id' | 'created_at' | 'user_id'>,
  currentRemainingSar: number,
  currentRemainingYmr: number
): Promise<void> {
  // 1. Create the expense
  const { error: expenseError } = await supabase
    .from('expenses')
    .insert(expenseData);
  if (expenseError) throw expenseError;

  // 2. Update the debt remaining amount
  const newRemainingSar = Math.max(0, currentRemainingSar - amountSar);
  const newRemainingYmr = Math.max(0, currentRemainingYmr - amountYmr);
  const { error: debtError } = await supabase
    .from('debts')
    .update({ 
      remaining_amount_sar: newRemainingSar,
      remaining_amount_ymr: newRemainingYmr
    })
    .eq('id', debtId);
  if (debtError) throw debtError;
}

export async function deleteDebt(id: string): Promise<void> {
  const { error } = await supabase.from('debts').delete().eq('id', id);
  if (error) throw error;
}
