import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjgmrkgjstklrxcejlfk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ21ya2dqc3RrbHJ4Y2VqbGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDc4NDEsImV4cCI6MjA4NTkyMzg0MX0.GQNytFAqxL83-dct9pN-bu2Z5ROlSQwRKAqSuY0tY7s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("\nQuerying User table for tech@ithub.com...");
  const { data, error } = await supabase.from('User').select('*').eq('email', 'employee-test@ithub.com').maybeSingle();
  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Query Result:", data);
  }

  console.log("\nQuerying all users...");
  const { data: allUsers, error: allUsersError } = await supabase.from('User').select('id, email, role');
  if (allUsersError) {
    console.error("All Users Query Error:", allUsersError);
  } else {
    console.log("All Users:", allUsers);
  }
}

check().catch(console.error);
