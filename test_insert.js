import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjgmrkgjstklrxcejlfk.supabase.co';
const correctKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ21ya2dqc3RrbHJ4Y2VqbGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDc4NDEsImV4cCI6MjA4NTkyMzg0MX0.GQNytFAqxL83-dct9pN-bu2Z5ROlSQwRKAqSuY0tY7s';
const supabase = createClient(supabaseUrl, correctKey);

async function test() {
  console.log("Testing Task insert with createdById = null...");
  const { data: taskData, error: taskError } = await supabase.from('Task').insert([{
    id: 'test-uuid-task-null',
    title: 'Test Task Null createdById',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: null,
    createdById: null,
    spaceId: null,
    listId: null,
    ticketId: null,
    updatedAt: new Date().toISOString()
  }]).select('*');
  console.log("Task Result:", taskData, "Error:", taskError);

  console.log("\nTesting Ticket insert with reporterId = null...");
  const { data: ticketData, error: ticketError } = await supabase.from('Ticket').insert([{
    id: 'test-uuid-ticket-null',
    ticketNumber: 'TKNULL12',
    title: 'Test Ticket Null reporterId',
    description: 'Test Description',
    status: 'OPEN',
    priority: 'MEDIUM',
    reporterId: null,
    assigneeId: null,
    category: 'General',
    updatedAt: new Date().toISOString()
  }]).select('*');
  console.log("Ticket Result:", ticketData, "Error:", ticketError);

  // Clean up
  await supabase.from('Task').delete().eq('id', 'test-uuid-task-null');
  await supabase.from('Ticket').delete().eq('id', 'test-uuid-ticket-null');
}
test().catch(console.error);
