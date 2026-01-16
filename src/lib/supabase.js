import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ephbymzrrornzgfmhhll.supabase.co'
const supabaseAnonKey = 'sb_publishable_kvZJrCCgqQEXbLqy2KKzdg_XbvXFBh4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)