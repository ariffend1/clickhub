import { createClient } from '@supabase/supabase-js';

// Active Supabase instance (clickhub2026 - tmhuocijjbkdijdpxpgf)
const RAW_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tmhuocijjbkdijdpxpgf.supabase.co';
const RAW_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtaHVvY2lqamJrZGlqZHB4cGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NTQxODcsImV4cCI6MjEwNzUzMDE4N30.pqLxp2V8WHCXsOc51txk-CWCxv9alhcl3TpJoqQqGz4';

// Safety Guard: If Vercel env still injects the old/restricted project URLs, automatically redirect to the active project tmhuocijjbkdijdpxpgf
const isRestrictedUrl = RAW_URL.includes('susnckrhlpahyjecbyow') || RAW_URL.includes('dehyfhlhquzfemgammxy');

const supabaseUrl = isRestrictedUrl ? 'https://tmhuocijjbkdijdpxpgf.supabase.co' : RAW_URL;
const supabaseAnonKey = isRestrictedUrl 
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtaHVvY2lqamJrZGlqZHB4cGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NTQxODcsImV4cCI6MjEwNzUzMDE4N30.pqLxp2V8WHCXsOc51txk-CWCxv9alhcl3TpJoqQqGz4' 
  : RAW_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



