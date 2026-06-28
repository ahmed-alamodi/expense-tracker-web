-- إضافة حقول العملة الثانية (YMR) لجدول الديون
ALTER TABLE public.debts 
ADD COLUMN total_amount_ymr numeric NOT NULL DEFAULT 0,
ADD COLUMN remaining_amount_ymr numeric NOT NULL DEFAULT 0;
