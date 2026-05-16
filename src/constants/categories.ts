import { CategoryGroup, CurrencyConfig } from '@/types/expense';

export const DEFAULT_CATEGORIES: CategoryGroup[] = [
  { main: 'طعام', subs: ['مطاعم', 'بقالة', 'مشروبات', 'وجبات سريعة'] },
  { main: 'مقاضي البيت', subs: ['بقالة', 'أدوات منزلية', 'تنظيف'] },
  { main: 'اتصالات', subs: ['جوال', 'إنترنت', 'ADSL'] },
  { main: 'مواصلات', subs: ['وقود', 'السيكل', 'تاكسي', 'صيانة سيارة'] },
  { main: 'ترفيه', subs: ['اشتراكات ترفيه', 'ملاهي', 'ألعاب', 'سفر'] },
  { main: 'صحة', subs: ['أدوية', 'مستشفى', 'تحاليل'] },
  { main: 'ملابس', subs: ['ملابس', 'أحذية', 'إكسسوارات'] },
  { main: 'صدقة', subs: ['صدقة', 'زكاة', 'تبرعات'] },
  { main: 'تعليم', subs: ['كتب', 'دورات', 'مدرسة'] },
  { main: 'أخرى', subs: ['صيانة ذهب', 'هدايا', 'أخرى'] },
];

export const DEFAULT_PAYMENT_METHODS = ['البسري', 'العمقي', 'كاش', 'بطاقة بنكية'];

export const DEFAULT_EXCHANGE_RATE = 410;

export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  primary: { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س' },
  secondary: { code: 'YMR', name: 'ريال يمني', symbol: 'ي.ر' },
  exchangeRate: DEFAULT_EXCHANGE_RATE,
};

export const CATEGORY_COLORS: Record<string, string> = {
  'طعام': '#FF6B6B',
  'مقاضي البيت': '#4ECDC4',
  'اتصالات': '#45B7D1',
  'مواصلات': '#96CEB4',
  'ترفيه': '#FFEAA7',
  'صحة': '#DDA0DD',
  'ملابس': '#98D8C8',
  'صدقة': '#87CEEB',
  'تعليم': '#F7DC6F',
  'أخرى': '#B0BEC5',
};
