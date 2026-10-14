import { createClient } from '@supabase/supabase-js';

// Active Supabase instance (clickhub2026 - tmhuocijjbkdijdpxpgf)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tmhuocijjbkdijdpxpgf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtaHVvY2lqamJrZGlqZHB4cGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NTQxODcsImV4cCI6MjEwNzUzMDE4N30.pqLxp2V8WHCXsOc51txk-CWCxv9alhcl3TpJoqQqGz4';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



