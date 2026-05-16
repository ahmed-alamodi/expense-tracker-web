import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwjxvkdyiaggteeyxszy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3anh2a2R5aWFnZ3RlZXl4c3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MzA0NzksImV4cCI6MjA4OTAwNjQ3OX0._HdEnmtgUs3w17wixY5rVssH5RWpd_5gMSm98tNXjRM';

const isConfigured = supabaseUrl.startsWith('http');

let _supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_supabase) {
    if (!isConfigured) {
      throw new Error('Supabase غير مُعَدّ');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export { isConfigured };
