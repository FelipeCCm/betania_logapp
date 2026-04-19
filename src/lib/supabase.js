import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Variáveis de ambiente ausentes. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em gym-progress/.env (use .env.example como referência) e reinicie o dev server.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'betania_auth_token',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
