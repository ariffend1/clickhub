import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://susnckrhlpahyjecbyow.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1c25ja3JobHBhaHlqZWNieW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTAwNjAsImV4cCI6MjEwNDk4NjA2MH0.YrIpym4znAtOa20ZOQ_YgU-3qRD_RRvVdQBakIH68VQ';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);


