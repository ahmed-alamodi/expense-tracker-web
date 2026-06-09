-- إنشاء جدول طرق الدفع (Payment Methods)
CREATE TABLE public.payment_methods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- سياسات الأمان (Row Level Security) للمستخدمين
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدم يمكنه رؤية طرق الدفع الخاصة به فقط"
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدم يمكنه إضافة طرق دفع"
  ON public.payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدم يمكنه تعديل طرق الدفع الخاصة به"
  ON public.payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدم يمكنه حذف طرق الدفع الخاصة به"
  ON public.payment_methods FOR DELETE
  USING (auth.uid() = user_id);
