import { createClient } from '@supabase/supabase-js';

function env(key: string) {
  return (import.meta.env[key] || '').trim();
}

const supabaseUrl = env('VITE_SUPABASE_URL');
const supabasePublishableKey = env('VITE_SUPABASE_PUBLISHABLE_KEY');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;
