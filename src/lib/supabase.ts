import { createClient } from '@supabase/supabase-js';

// Active Supabase instance (ariffend1's projects - Singapore)
const supabaseUrl = 'https://susnckrhlpahyjecbyow.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1c25ja3JobHBhaHlqZWNieW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MTAwNjAsImV4cCI6MjEwNDk4NjA2MH0.YrIpym4znAtOa20ZOQ_YgU-3qRD_RRvVdQBakIH68VQ';

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);



