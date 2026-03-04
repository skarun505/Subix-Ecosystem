import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey } from '@subix/config';

// ✅ Unified Subix Accounts project — shared with accounts.subix.in and LeadOS
const SUPABASE_URL = supabaseUrl;
const SUPABASE_ANON_KEY = supabaseKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

