import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjgmrkgjstklrxcejlfk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ21ya2dqc3RrbHJ4Y2VqbGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDc4NDEsImV4cCI6MjA4NTkyMzg0MX0.GQNytFAqxL83-dct9pN-bu2Z5ROlSQwRKAqSuY0tY7s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log("==============================================");
  console.log("STARTING DATABASE SEEDING FOR REPORTS TESTING");
  console.log("==============================================");

  // 1. Clean up existing mock records
  console.log("\nCleaning up previous mock data...");
  
  const { error: delTicketsErr } = await supabase.from('Ticket').delete().like('id', 'mock-ticket-%');
  if (delTicketsErr) console.error("Error deleting old tickets:", delTicketsErr);
  
  const { error: delAssetsErr } = await supabase.from('Asset').delete().like('id', 'mock-asset-%');
  if (delAssetsErr) console.error("Error deleting old assets:", delAssetsErr);
  
  const { error: delInvErr } = await supabase.from('Inventory').delete().like('id', 'mock-inv-%');
  if (delInvErr) console.error("Error deleting old inventory:", delInvErr);

  console.log("✓ Cleanup finished.");

  // Define active users in the system to assign tickets to
  const reporterId = 'cmpw8rn5a000011nor636ggwj'; // employee-test@ithub.com
  const assigneeId = 'user-tech-001';            // tech@ithub.com
  const nowStr = new Date().toISOString();

  // 2. Insert mock tickets
  console.log("\nSeeding Tickets...");
  const mockTickets = [
    // --- SLA MET TICKETS ---
    {
      id: 'mock-ticket-001',
      ticketNumber: 'M-TKT-001',
      title: 'Koneksi Wi-Fi Lantai 2 Putus-putus',
      description: 'Wi-Fi di ruang marketing sering request timeout.',
      status: 'RESOLVED',
      priority: 'HIGH',
      reporterId,
      assigneeId,
      category: 'Network',
      createdAt: '2026-06-01T08:00:00Z',
      updatedAt: '2026-06-01T11:30:00Z',
      resolvedAt: '2026-06-01T11:30:00Z',
      slaDeadline: '2026-06-01T12:00:00Z', // Met (Resolved in 3.5 hrs, limit 4 hrs)
      csatRating: 5,
      csatFeedback: 'Sangat cepat responnya dan langsung beres! Mantap.'
    },
    {
      id: 'mock-ticket-002',
      ticketNumber: 'M-TKT-002',
      title: 'Aplikasi Email Outlook error',
      description: 'Tidak bisa sync inbox baru sejak kemarin malam.',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      reporterId,
      assigneeId,
      category: 'Software',
      createdAt: '2026-06-02T09:00:00Z',
      updatedAt: '2026-06-02T15:00:00Z',
      resolvedAt: '2026-06-02T15:00:00Z',
      slaDeadline: '2026-06-02T21:00:00Z', // Met (Resolved in 6 hrs, limit 12 hrs)
      csatRating: 4,
      csatFeedback: 'Bagus dan ramah pelayanannya.'
    },
    {
      id: 'mock-ticket-003',
      ticketNumber: 'M-TKT-003',
      title: 'Server Database Backup Lambat',
      description: 'Job backup harian membutuhkan waktu 8 jam dari biasanya hanya 2 jam.',
      status: 'RESOLVED',
      priority: 'HIGH',
      reporterId,
      assigneeId,
      category: 'Server',
      createdAt: '2026-06-03T01:00:00Z',
      updatedAt: '2026-06-03T04:30:00Z',
      resolvedAt: '2026-06-03T04:30:00Z',
      slaDeadline: '2026-06-03T05:00:00Z', // Met (Resolved in 3.5 hrs, limit 4 hrs)
      csatRating: 5,
      csatFeedback: 'Masalah beres sebelum jam kantor mulai.'
    },
    {
      id: 'mock-ticket-004',
      ticketNumber: 'M-TKT-004',
      title: 'Layar Monitor Berkedip',
      description: 'Layar monitor eksternal sering mati sendiri selama 2 detik lalu menyala.',
      status: 'RESOLVED',
      priority: 'LOW',
      reporterId,
      assigneeId,
      category: 'Hardware',
      createdAt: '2026-06-03T10:00:00Z',
      updatedAt: '2026-06-04T09:00:00Z',
      resolvedAt: '2026-06-04T09:00:00Z',
      slaDeadline: '2026-06-04T10:00:00Z', // Met (Resolved in 23 hrs, limit 24 hrs)
      csatRating: 4,
      csatFeedback: 'Diganti kabel HDMI baru langsung normal.'
    },

    // --- SLA BREACHED TICKETS ---
    {
      id: 'mock-ticket-005',
      ticketNumber: 'M-TKT-005',
      title: 'VPN Kantor Tidak Bisa Terhubung',
      description: 'Error 807 saat mencoba login VPN dari rumah.',
      status: 'RESOLVED',
      priority: 'HIGH',
      reporterId,
      assigneeId,
      category: 'Network',
      createdAt: '2026-06-01T10:00:00Z',
      updatedAt: '2026-06-01T17:00:00Z',
      resolvedAt: '2026-06-01T17:00:00Z',
      slaDeadline: '2026-06-01T14:00:00Z', // Breached (Resolved in 7 hrs, limit 4 hrs)
      csatRating: 3,
      csatFeedback: 'Agak lama penanganannya padahal saya butuh kerja urgent.'
    },
    {
      id: 'mock-ticket-006',
      ticketNumber: 'M-TKT-006',
      title: 'Laptop Sering Blue Screen (BSOD)',
      description: 'Laptop crash IRQL_NOT_LESS_OR_EQUAL saat buka browser.',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      reporterId,
      assigneeId,
      category: 'Hardware',
      createdAt: '2026-06-02T08:00:00Z',
      updatedAt: '2026-06-03T10:00:00Z',
      resolvedAt: '2026-06-03T10:00:00Z',
      slaDeadline: '2026-06-02T20:00:00Z', // Breached (Resolved in 26 hrs, limit 12 hrs)
      csatRating: 1,
      csatFeedback: 'Sangat lambat, laptop saya ditinggal 1 harian tanpa kabar.'
    },

    // --- ACTIVE OPEN TICKETS ---
    {
      id: 'mock-ticket-007',
      ticketNumber: 'M-TKT-007',
      title: 'Permintaan Instalasi Adobe Photoshop',
      description: 'Butuh lisensi dan instalasi Photoshop untuk anak magang baru.',
      status: 'OPEN',
      priority: 'LOW',
      reporterId,
      assigneeId: null,
      category: 'Software',
      createdAt: '2026-06-04T13:00:00Z',
      updatedAt: '2026-06-04T13:00:00Z',
      slaDeadline: '2026-06-05T13:00:00Z'
    },
    {
      id: 'mock-ticket-008',
      ticketNumber: 'M-TKT-008',
      title: 'Switch Port di Meja R3 Mati',
      description: 'Kabel LAN dicolok tidak ada lampu indikator menyala.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      reporterId,
      assigneeId,
      category: 'Network',
      createdAt: '2026-06-05T02:00:00Z',
      updatedAt: '2026-06-05T03:00:00Z',
      slaDeadline: '2026-06-05T14:00:00Z'
    },
    {
      id: 'mock-ticket-009',
      ticketNumber: 'M-TKT-009',
      title: 'Akses Website Internal Lambat',
      description: 'Halaman intranet loading sampai 30 detik.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      reporterId,
      assigneeId,
      category: 'Network',
      createdAt: '2026-06-05T04:00:00Z',
      updatedAt: '2026-06-05T05:00:00Z',
      slaDeadline: '2026-06-05T16:00:00Z'
    },
    {
      id: 'mock-ticket-010',
      ticketNumber: 'M-TKT-010',
      title: 'Error Autentikasi LDAP',
      description: 'User baru tidak bisa login karena gagal koneksi LDAP Active Directory.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      reporterId,
      assigneeId,
      category: 'Security',
      createdAt: '2026-06-05T06:00:00Z',
      updatedAt: '2026-06-05T06:30:00Z',
      slaDeadline: '2026-06-05T10:00:00Z'
    },
    {
      id: 'mock-ticket-011',
      ticketNumber: 'M-TKT-011',
      title: 'Router Core Sering Restart',
      description: 'Router core di Server Room restart otomatis secara random.',
      status: 'OPEN',
      priority: 'CRITICAL',
      reporterId,
      assigneeId: null,
      category: 'Network',
      createdAt: '2026-06-05T08:00:00Z',
      updatedAt: '2026-06-05T08:00:00Z',
      slaDeadline: '2026-06-05T10:00:00Z'
    }
  ];

  const { error: insTicketErr } = await supabase.from('Ticket').insert(mockTickets);
  if (insTicketErr) {
    console.error("✗ Failed to insert tickets:", insTicketErr);
  } else {
    console.log("✓ 11 Tickets successfully seeded.");
  }

  // 3. Insert mock assets
  console.log("\nSeeding Assets...");
  const mockAssets = [
    {
      id: 'mock-asset-001',
      name: 'MacBook Pro M2 16GB',
      brand: 'Apple',
      type: 'Laptop',
      serialNumber: 'SN-APL-MBP2023',
      location: 'IT Storage Lab',
      status: 'AVAILABLE',
      purchaseDate: '2023-05-10T00:00:00', // Age: 3 years.
      price: 25000000,
      vendor: 'iBox Indonesia',
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    },
    {
      id: 'mock-asset-002',
      name: 'Dell PowerEdge R750',
      brand: 'Dell',
      type: 'Server',
      serialNumber: 'SN-DLL-SRV2024',
      location: 'Data Center Room B',
      status: 'IN_USE',
      purchaseDate: '2024-02-15T00:00:00', // Age: 2 years.
      price: 80000000,
      vendor: 'Dell Indonesia Official',
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    },
    {
      id: 'mock-asset-003',
      name: 'Cisco Catalyst Switch 24P',
      brand: 'Cisco',
      type: 'Switch',
      serialNumber: 'SN-CSC-SW2020',
      location: 'Rack Server 2',
      status: 'IN_USE',
      purchaseDate: '2020-04-10T00:00:00', // Age: 6 years (>= 4 yrs).
      price: 12000000,
      vendor: 'Sinergi Komputindo',
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    },
    {
      id: 'mock-asset-004',
      name: 'Fluke LinkRunner G2',
      brand: 'Fluke',
      type: 'Tool',
      serialNumber: 'SN-FLK-NET2021',
      location: 'IT Support Lab',
      status: 'AVAILABLE',
      purchaseDate: '2021-09-20T00:00:00', // Age: 5 years (>= 4 yrs).
      price: 20000000,
      vendor: 'Eka Instrument',
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    },
    {
      id: 'mock-asset-005',
      name: 'Lenovo ThinkPad T14 Gen 4',
      brand: 'Lenovo',
      type: 'Laptop',
      serialNumber: 'SN-LNV-TP2025',
      location: 'General Office',
      status: 'AVAILABLE',
      purchaseDate: '2025-01-10T00:00:00', // Age: 1 year.
      price: 18000000,
      vendor: 'Lenovo Indonesia',
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    }
  ];

  const { error: insAssetErr } = await supabase.from('Asset').insert(mockAssets);
  if (insAssetErr) {
    console.error("✗ Failed to insert assets:", insAssetErr);
  } else {
    console.log("✓ 5 Assets successfully seeded.");
  }

  // 4. Insert mock inventory items
  console.log("\nSeeding Inventory / Spare Parts...");
  const mockInventory = [
    {
      id: 'mock-inv-001',
      name: 'UTP Cat6 Cable Roll 305m',
      description: 'Kabel UTP Cat6 merk Belden kualitas premium.',
      sku: 'BEL-CAT6-305M',
      quantity: 12,
      minStock: 5, // Normal Stock (12 > 5)
      unit: 'roll',
      location: 'Warehouse A',
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    },
    {
      id: 'mock-inv-002',
      name: 'RJ45 Connector Panduit Cat6',
      description: 'Panduit modular connector 100pcs/box.',
      sku: 'PAN-RJ45-C6',
      quantity: 3,
      minStock: 20, // Low Stock Warning (3 <= 20) -> Mendesak (15%)
      unit: 'box',
      location: 'Warehouse B',
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    },
    {
      id: 'mock-inv-003',
      name: 'SSD SATA Samsung 870 EVO 500GB',
      description: 'SSD untuk upgrade laptop lambat.',
      sku: 'SAM-SSD-500GB',
      quantity: 1,
      minStock: 10, // Urgent Low Stock (1 <= 10) -> Mendesak (10%)
      unit: 'pcs',
      location: 'IT Lab Rack 3',
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    },
    {
      id: 'mock-inv-004',
      name: 'RAM DDR4 Corsair 16GB 3200Mhz',
      description: 'RAM Upgrade module DDR4 desktop.',
      sku: 'COR-RAM-16GB',
      quantity: 0,
      minStock: 8, // Out of Stock (0 <= 8) -> Kritis (Habis)
      unit: 'pcs',
      location: 'IT Lab Rack 3',
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    }
  ];

  const { error: insInvErr } = await supabase.from('Inventory').insert(mockInventory);
  if (insInvErr) {
    console.error("✗ Failed to insert inventory:", insInvErr);
  } else {
    console.log("✓ 4 Inventory items successfully seeded.");
  }

  console.log("\n==============================================");
  console.log("DATABASE SEEDING SUCCESSFUL!");
  console.log("Go to the Reports page to review the charts.");
  console.log("==============================================");
}

seed().catch(console.error);
