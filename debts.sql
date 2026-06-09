-- إنشاء جدول الديون (Debts)
CREATE TABLE public.debts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  total_amount_sar numeric NOT NULL DEFAULT 0,
  remaining_amount_sar numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  notes text,
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- سياسات الأمان (Row Level Security) للمستخدمين
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدم يمكنه رؤية ديونه فقط"
  ON public.debts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدم يمكنه إضافة ديون"
  ON public.debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدم يمكنه تعديل ديونه"
  ON public.debts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدم يمكنه حذف ديونه"
  ON public.debts FOR DELETE
  USING (auth.uid() = user_id);
