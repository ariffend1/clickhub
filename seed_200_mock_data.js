import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjgmrkgjstklrxcejlfk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ21ya2dqc3RrbHJ4Y2VqbGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDc4NDEsImV4cCI6MjA4NTkyMzg0MX0.GQNytFAqxL83-dct9pN-bu2Z5ROlSQwRKAqSuY0tY7s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log("=================================================");
  console.log("STARTING PROGRAMMATIC SEEDING OF 200+ TEST DATA");
  console.log("=================================================");

  // 1. Clean up old mock records
  console.log("\nCleaning up previous mock data (mock- and mock200-)...");
  
  const { error: delTicketsErr } = await supabase.from('Ticket').delete().or('id.like.mock-ticket-%,id.like.mock200-ticket-%');
  if (delTicketsErr) console.error("Error deleting old tickets:", delTicketsErr);
  
  const { error: delAssetsErr } = await supabase.from('Asset').delete().or('id.like.mock-asset-%,id.like.mock200-asset-%');
  if (delAssetsErr) console.error("Error deleting old assets:", delAssetsErr);
  
  const { error: delInvErr } = await supabase.from('Inventory').delete().or('id.like.mock-inv-%,id.like.mock200-inv-%');
  if (delInvErr) console.error("Error deleting old inventory:", delInvErr);

  console.log("✓ Cleanup finished.");

  const reporterId = 'cmpw8rn5a000011nor636ggwj'; // employee-test@ithub.com
  const assigneeId = 'user-tech-001';            // tech@ithub.com
  const now = new Date();
  const nowStr = now.toISOString();

  // 2. Generate 200 Tickets
  console.log("\nGenerating 200 mock tickets...");
  const ticketsList = [];

  const categories = [
    { name: 'Network', pct: 0.38 },   // 76 tickets
    { name: 'Software', pct: 0.25 },  // 50 tickets
    { name: 'Hardware', pct: 0.20 },  // 40 tickets
    { name: 'Server', pct: 0.10 },    // 20 tickets
    { name: 'Security', pct: 0.05 },  // 10 tickets
    { name: 'Policy', pct: 0.02 }     // 4 tickets
  ];

  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  
  const satisfiedFeedback = [
    "Respon cepat dan ramah, mantap!",
    "Masalah langsung selesai oleh teknisi.",
    "Pelayanan sangat memuaskan.",
    "Penanganan profesional.",
    "Terima kasih atas bantuan kilatnya!",
    "Selesai dengan baik dan rapi."
  ];

  const dissatisfiedFeedback = [
    "Sangat lambat dihubungi kembali.",
    "Teknisi kurang paham masalahnya.",
    "Butuh waktu terlalu lama untuk resolve.",
    "Kurang responsif.",
    "Tiket dibiarkan gantung berhari-hari."
  ];

  // Map categories deterministically to match target percentages
  const getCategoryForIndex = (index) => {
    let acc = 0;
    for (const cat of categories) {
      acc += Math.round(cat.pct * 200);
      if (index < acc) return cat.name;
    }
    return 'General';
  };

  for (let i = 0; i < 200; i++) {
    const ticketId = `mock200-ticket-${String(i).padStart(3, '0')}`;
    const tktNum = `M200-${String(i).padStart(3, '0')}`;
    const category = getCategoryForIndex(i);

    // Spread ticket creation dates over the last 30 days
    const daysAgo = 30 - (i % 30);
    const hoursAgo = (i % 24);
    const minutesAgo = (i % 60);
    const createdDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
    
    // Status distribution: 160 resolved (80%), 40 active (20%)
    const isResolved = i < 160;
    const status = isResolved ? 'RESOLVED' : (i % 3 === 0 ? 'IN_PROGRESS' : 'OPEN');
    
    // Priority distribution
    let priority = 'MEDIUM';
    if (i % 7 === 0) priority = 'HIGH';
    else if (i % 19 === 0) priority = 'CRITICAL';
    else if (i % 4 === 0) priority = 'LOW';

    // SLA hours limit calculation
    let slaHours = 12; // MEDIUM
    if (priority === 'CRITICAL') slaHours = 2;
    else if (priority === 'HIGH') slaHours = 4;
    else if (priority === 'LOW') slaHours = 24;

    const slaDeadline = new Date(createdDate.getTime() + (slaHours * 60 * 60 * 1000));

    // SLA compliance distribution: 130 met, 30 breached out of 160 resolved
    let resolvedDate = null;
    if (isResolved) {
      const isSlaMet = i < 130; // 130 met, 30 breached
      if (isSlaMet) {
        // Resolve time is randomly between 10% and 90% of SLA limit
        const resolveFactor = 0.1 + (i % 9) * 0.1;
        resolvedDate = new Date(createdDate.getTime() + (slaHours * resolveFactor * 60 * 60 * 1000));
      } else {
        // Resolve time is randomly between 110% and 300% of SLA limit
        const resolveFactor = 1.1 + (i % 20) * 0.1;
        resolvedDate = new Date(createdDate.getTime() + (slaHours * resolveFactor * 60 * 60 * 1000));
      }
    }

    // CSAT ratings: 120 ratings out of 160 resolved
    let csatRating = null;
    let csatFeedback = null;
    if (isResolved && i < 120) {
      // CSAT rating distribution: 60 (5*), 40 (4*), 12 (3*), 5 (2*), 3 (1*)
      if (i < 60) {
        csatRating = 5;
        csatFeedback = satisfiedFeedback[i % satisfiedFeedback.length];
      } else if (i < 100) {
        csatRating = 4;
        csatFeedback = satisfiedFeedback[i % satisfiedFeedback.length];
      } else if (i < 112) {
        csatRating = 3;
        csatFeedback = "Biasa saja, standar.";
      } else if (i < 117) {
        csatRating = 2;
        csatFeedback = dissatisfiedFeedback[i % dissatisfiedFeedback.length];
      } else {
        csatRating = 1;
        csatFeedback = dissatisfiedFeedback[i % dissatisfiedFeedback.length];
      }
    }

    ticketsList.push({
      id: ticketId,
      ticketNumber: tktNum,
      title: `Kendala ${category} #${i + 1}`,
      description: `Deskripsi kendala operasional terkait ${category} pada sistem kerja divisi ke-${(i % 5) + 1}.`,
      status,
      priority,
      reporterId,
      assigneeId: status === 'OPEN' ? null : assigneeId,
      category,
      createdAt: createdDate.toISOString(),
      updatedAt: (resolvedDate || createdDate).toISOString(),
      resolvedAt: resolvedDate ? resolvedDate.toISOString() : null,
      slaDeadline: slaDeadline.toISOString(),
      csatRating,
      csatFeedback,
      isArchived: false,
      isDeleteRequested: false
    });
  }

  // Insert tickets in batches of 50 to avoid network limits
  console.log("Inserting tickets in batches of 50...");
  for (let i = 0; i < ticketsList.length; i += 50) {
    const batch = ticketsList.slice(i, i + 50);
    const { error } = await supabase.from('Ticket').insert(batch);
    if (error) {
      console.error(`✗ Error inserting ticket batch starting at index ${i}:`, error);
      return;
    }
    console.log(`✓ Inserted tickets ${i + 1} to ${Math.min(i + 50, ticketsList.length)}`);
  }

  // 3. Generate 30 Assets
  console.log("\nGenerating 30 mock assets...");
  const assetsList = [];
  const assetTypes = ['Laptop', 'Desktop', 'Server', 'Printer', 'Switch', 'Monitor', 'Other'];
  const brands = ['Apple', 'Dell', 'Lenovo', 'HP', 'Cisco', 'Asus'];
  const locations = ['IT Storage Lab', 'Data Center Room A', 'HQ Office Lantai 1', 'HQ Office Lantai 3', 'Finance Room'];

  for (let i = 0; i < 30; i++) {
    const assetId = `mock200-asset-${String(i).padStart(3, '0')}`;
    const sn = `SN-M200-${String(i).padStart(3, '0')}`;
    const type = assetTypes[i % assetTypes.length];
    const brand = brands[i % brands.length];
    const location = locations[i % locations.length];

    // Purchase year: spread from 2019 to 2026. 8 items will be 2022 or earlier (age >= 4 years)
    const purchaseYear = 2026 - (i % 8);
    const purchaseDate = `${purchaseYear}-04-12T00:00:00`;

    // Price between 5 million IDR and 100 million IDR
    const priceFactor = (i % 20) + 1; // 1 to 20
    const price = priceFactor * 5000000;

    assetsList.push({
      id: assetId,
      name: `${brand} ${type} Dev-${i + 1}`,
      brand,
      type,
      serialNumber: sn,
      location,
      status: i % 10 === 0 ? 'MAINTENANCE' : (i % 4 === 0 ? 'AVAILABLE' : 'IN_USE'),
      purchaseDate,
      price,
      vendor: `Vendor Resmi ${brand}`,
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    });
  }

  const { error: insAssetErr } = await supabase.from('Asset').insert(assetsList);
  if (insAssetErr) {
    console.error("✗ Failed to insert assets:", insAssetErr);
  } else {
    console.log("✓ 30 Assets successfully seeded.");
  }

  // 4. Generate 20 Inventory Items
  console.log("\nGenerating 20 mock inventory items...");
  const inventoryList = [];
  const itemNames = [
    { name: 'Kabel UTP Cat6 Belden', unit: 'roll', min: 10, sku: 'UTP-BLD' },
    { name: 'Konektor RJ45 Panduit', unit: 'box', min: 40, sku: 'RJ45-PND' },
    { name: 'Solid State Drive SSD 512GB', unit: 'pcs', min: 15, sku: 'SSD-512' },
    { name: 'RAM Kingston DDR4 8GB', unit: 'pcs', min: 20, sku: 'RAM-8GB' },
    { name: 'SFP Transceiver Cisco 10G', unit: 'pcs', min: 8, sku: 'SFP-10G' },
    { name: 'Mouse USB Logitech B100', unit: 'pcs', min: 30, sku: 'MOU-LOG' },
    { name: 'Keyboard USB Logitech K120', unit: 'pcs', min: 25, sku: 'KEY-LOG' },
    { name: 'Kabel Power CPU 1.5m', unit: 'pcs', min: 50, sku: 'PWR-CPU' },
    { name: 'Patch Cord Fiber LC-LC 3m', unit: 'pcs', min: 15, sku: 'PTC-FIB' },
    { name: 'Crimping Tool Pro', unit: 'pcs', min: 5, sku: 'CRM-PRO' }
  ];

  for (let i = 0; i < 20; i++) {
    const invId = `mock200-inv-${String(i).padStart(3, '0')}`;
    const base = itemNames[i % itemNames.length];
    
    // Low stock distribution: 6 items will have quantity <= minStock
    const isLowStock = i % 3 === 0;
    const isOutOfStock = i % 9 === 0;

    let quantity = base.min + 15;
    if (isLowStock) {
      quantity = Math.round(base.min * 0.3); // Mendesak (~30% of minStock)
    }
    if (isOutOfStock) {
      quantity = 0; // Kritis (Habis)
    }

    inventoryList.push({
      id: invId,
      name: `${base.name} Pack-${Math.floor(i / 10) + 1}`,
      description: `Stok cadangan ${base.name} untuk operasional harian gedung kantor.`,
      sku: `${base.sku}-${String(i).padStart(3, '0')}`,
      quantity,
      minStock: base.min,
      unit: base.unit,
      location: i % 2 === 0 ? 'Warehouse A' : 'IT Support Room',
      isVerified: true,
      createdAt: nowStr,
      updatedAt: nowStr
    });
  }

  const { error: insInvErr } = await supabase.from('Inventory').insert(inventoryList);
  if (insInvErr) {
    console.error("✗ Failed to insert inventory:", insInvErr);
  } else {
    console.log("✓ 20 Inventory items successfully seeded.");
  }

  console.log("\n=================================================");
  console.log("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("Total inserted:");
  console.log("  - Tickets: 200");
  console.log("  - Assets: 30");
  console.log("  - Inventory: 20");
  console.log("All data metrics are fully aligned with the dashboard.");
  console.log("=================================================");
}

seed().catch(console.error);
