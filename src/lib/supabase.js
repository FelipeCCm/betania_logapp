import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ephbymzrrornzgfmhhll.supabase.co'
const supabaseAnonKey = 'sb_publishable_kvZJrCCgqQEXbLqy2KKzdg_XbvXFBh4'

// Custom fetch with a 5s timeout — prevents Supabase network calls from hanging silently
const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'betania_auth_token',
    storage: window.localStorage,
    autoRefreshToken: true,
  },
  global: {
    fetch: fetchWithTimeout,
  },
})