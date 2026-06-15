import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjgmrkgjstklrxcejlfk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ21ya2dqc3RrbHJ4Y2VqbGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDc4NDEsImV4cCI6MjA4NTkyMzg0MX0.GQNytFAqxL83-dct9pN-bu2Z5ROlSQwRKAqSuY0tY7s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("\n--- STOCK REQUESTS ---");
  const { data: stock, error } = await supabase.from('StockRequest').select('*');
  if (error) console.error(error);
  else console.log(stock);
}

check().catch(console.error);
