import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjgmrkgjstklrxcejlfk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ21ya2dqc3RrbHJ4Y2VqbGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDc4NDEsImV4cCI6MjA4NTkyMzg0MX0.GQNytFAqxL83-dct9pN-bu2Z5ROlSQwRKAqSuY0tY7s';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const users = [
    {
      id: 'cmpw8rn5a000011nor636ggwj',
      email: 'employee-test@ithub.com',
      name: 'Test Employee',
      password: 'password123',
      role: 'EMPLOYEE',
      isApproved: true,
      department: 'Marketing',
      phone: '08123456789',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user-tech-001',
      email: 'tech@ithub.com',
      name: 'Teknisi Test',
      password: 'password123',
      role: 'TECHNICIAN',
      isApproved: true,
      department: 'IT Support',
      phone: '08123456780',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'user-manager-001',
      email: 'manager@ithub.com',
      name: 'Manager Test',
      password: 'password123',
      role: 'MANAGER',
      isApproved: true,
      department: 'IT Management',
      phone: '08123456781',
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  console.log("Upserting ClickHub test users...");
  for (const user of users) {
    const { data, error } = await supabase.from('User').upsert(user, { onConflict: 'email' });
    if (error) {
      console.error(`Failed to upsert ${user.email}:`, error);
    } else {
      console.log(`✓ Upserted ${user.email}`);
    }
  }

  const inventoryItems = [
    {
      id: 'inv-rj45-test-01',
      name: 'RJ45 Connector Panduit',
      sku: 'RJ45-PND-TEST',
      quantity: 50,
      minStock: 10,
      unit: 'pcs',
      location: 'Warehouse A',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'inv-utp-test-01',
      name: 'UTP Cat6 Cable',
      sku: 'UTP-CAT6-TEST',
      quantity: 20,
      minStock: 5,
      unit: 'roll',
      location: 'Warehouse A',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  console.log("\nUpserting ClickHub test inventory items...");
  for (const item of inventoryItems) {
    const { data, error } = await supabase.from('Inventory').upsert(item, { onConflict: 'sku' });
    if (error) {
      console.error(`Failed to upsert inventory ${item.name}:`, error);
    } else {
      console.log(`✓ Upserted inventory ${item.name}`);
    }
  }
}

main().catch(console.error);
