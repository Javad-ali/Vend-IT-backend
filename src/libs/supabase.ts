import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../config/env.js';
const { supabaseUrl, supabaseServiceRoleKey } = getConfig();
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
