-- أداة حذف الجداول التي تم إنشاؤها بالخطأ
DROP TABLE IF EXISTS public.debts CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;

-- تحديث ذاكرة التخزين المؤقت للخادم بعد الحذف
NOTIFY pgrst, 'reload schema';
