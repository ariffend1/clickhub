import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjgmrkgjstklrxcejlfk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ21ya2dqc3RrbHJ4Y2VqbGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDc4NDEsImV4cCI6MjA4NTkyMzg0MX0.GQNytFAqxL83-dct9pN-bu2Z5ROlSQwRKAqSuY0tY7s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility to generate UUIDs programmatically
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function seedTasks() {
  console.log("==============================================");
  console.log("STARTING SEEDING FOR 30+ RICH WORKFLOW TASKS");
  console.log("==============================================");

  // 1. Clean up old seeded tasks (starting with 'seedt-')
  console.log("\nCleaning up previous seeded tasks/comments/checklists...");
  
  // Get all task IDs starting with 'seedt-'
  const { data: oldTasks } = await supabase.from('Task').select('id').like('id', 'seedt-%');
  if (oldTasks && oldTasks.length > 0) {
    const ids = oldTasks.map(t => t.id);
    await supabase.from('Checklist').delete().in('taskId', ids);
    await supabase.from('Comment').delete().in('taskId', ids);
    await supabase.from('Task').delete().in('id', ids);
  }
  console.log("✓ Cleanup finished.");

  // 2. Fetch or create Space & TaskList
  console.log("\nResolving Space and TaskList...");
  let { data: spaces } = await supabase.from('Space').select('*').limit(1);
  let spaceId;
  if (!spaces || spaces.length === 0) {
    spaceId = 'seedt-space-001';
    await supabase.from('Space').insert([{ id: spaceId, name: 'IT Infrastructure & Support', color: '#6366F1', icon: '🛠️', order: 0 }]);
    console.log("✓ Created Space: IT Infrastructure & Support");
  } else {
    spaceId = spaces[0].id;
    console.log(`✓ Using existing Space: ${spaces[0].name} (${spaceId})`);
  }

  let { data: lists } = await supabase.from('TaskList').select('*').eq('spaceId', spaceId).limit(1);
  let listId;
  if (!lists || lists.length === 0) {
    listId = 'seedt-list-001';
    await supabase.from('TaskList').insert([{ id: listId, name: 'Sprint 1 - Operations', color: '#6366F1', spaceId, order: 0 }]);
    console.log("✓ Created TaskList: Sprint 1 - Operations");
  } else {
    listId = lists[0].id;
    console.log(`✓ Using existing TaskList: ${lists[0].name} (${listId})`);
  }

  // 3. Resolve Manager and Technician Users
  console.log("\nResolving Manager and Technician...");
  const { data: dbUsers } = await supabase.from('User').select('*');
  
  let manager = dbUsers.find(u => u.email === 'manager@ithub.com' || u.role === 'MANAGER');
  let technician = dbUsers.find(u => u.email === 'tech@ithub.com' || u.role === 'TECHNICIAN');

  // Fallbacks if not found
  if (!manager) {
    manager = dbUsers.find(u => u.role === 'ROOT' || u.role === 'ADMIN') || dbUsers[0];
  }
  if (!technician) {
    technician = dbUsers.find(u => u.role !== 'EMPLOYEE' && u.id !== manager.id) || dbUsers[0];
  }

  console.log(`✓ Manager: ${manager?.name || manager?.email} (ID: ${manager?.id})`);
  console.log(`✓ Technician: ${technician?.name || technician?.email} (ID: ${technician?.id})`);

  // 4. Generate 30 tasks with complex workflows
  console.log("\nGenerating 30 tasks...");
  const tasks = [];
  const checklists = [];
  const comments = [];
  const statuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const now = new Date();

  const taskTemplates = [
    { title: "Instalasi dan Konfigurasi Access Point Floor 3", desc: "Pasang Cisco AP baru di ruang meeting utama lantai 3." },
    { title: "Audit Server OS Patching", desc: "Lakukan patching kernel Linux Ubuntu pada server staging." },
    { title: "Pemeliharaan AC Ruang Server Utama", desc: "Pembersihan kompresor AC utama dan pengecekan suhu." },
    { title: "Upgrade RAM Laptop Finance (Budi)", desc: "Upgrade laptop Lenovo Thinkpad Budi dari 8GB ke 16GB." },
    { title: "Audit Log Firewall Mingguan", desc: "Periksa log traffic mencurigakan di router Mikrotik utama." },
    { title: "Setting VPN Karyawan Magang", desc: "Buat akun OpenVPN baru untuk 5 anak magang divisi IT." },
    { title: "Backup Database Staging Bulanan", desc: "Lakukan cold backup database Supabase ke storage lokal PBS." },
    { title: "Uji Coba Generator Listrik Gedung B", desc: "Pengetesan switch genset otomatis setiap hari Sabtu pagi." },
    { title: "Instalasi Software Anti-Virus Bitdefender", desc: "Push instalasi Bitdefender ke 10 PC divisi Marketing." },
    { title: "Setting Printer Network Lantai 2", desc: "Sambungkan printer Epson L3250 ke IP static 192.168.5.55." }
  ];

  for (let i = 1; i <= 30; i++) {
    const taskId = `seedt-task-${String(i).padStart(3, '0')}`;
    const template = taskTemplates[(i - 1) % taskTemplates.length];
    
    // Distribute statuses and priorities deterministically
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    
    // Assignment details
    const isAssigned = i % 2 === 0; // Assign half of the tasks
    const assigneeId = isAssigned ? technician.id : null;
    
    // Dates spread over past 15 days
    const createdDate = new Date(now.getTime() - (i * 12 * 60 * 60 * 1000));
    
    tasks.push({
      id: taskId,
      title: `${template.title} (Task #${i})`,
      description: `${template.desc}\n\nDitugaskan oleh Manager: ${manager.name} kepada Teknisi: ${isAssigned ? technician.name : 'Belum Ditugaskan'}.`,
      status,
      priority,
      spaceId,
      listId,
      assigneeId,
      dueDate: new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
      ticketId: null
    });

    // Add Checklists (Subtasks) for richer workflow
    if (i % 3 === 0) {
      checklists.push(
        { id: uuidv4(), taskId, content: "Persiapan peralatan dan obeng/tang", isCompleted: i % 2 === 0 },
        { id: uuidv4(), taskId, content: "Pengecekan spesifikasi dan kecocokan hardware", isCompleted: i % 4 === 0 },
        { id: uuidv4(), taskId, content: "Uji coba fungsionalitas akhir", isCompleted: false }
      );
    }
  }

  // Insert to database
  console.log("Inserting Tasks in database...");
  const { error: taskErr } = await supabase.from('Task').insert(tasks);
  if (taskErr) {
    console.error("✗ Failed to insert tasks:", taskErr);
    return;
  }
  console.log(`✓ 30 Tasks successfully inserted.`);

  if (checklists.length > 0) {
    console.log("Inserting Checklists (Subtasks)...");
    const { error: checkErr } = await supabase.from('Checklist').insert(checklists);
    if (checkErr) console.error("Warning: Failed to insert checklists:", checkErr);
    else console.log(`✓ ${checklists.length} Checklist items inserted.`);
  }

  console.log("\n==============================================");
  console.log("🎉 SEEDING COMPLETED SUCCESSFULLY!");
  console.log("  - Generated Tasks: 30");
  console.log("  - Assigned to Technician: 15 tasks");
  console.log("  - Checklists: Loaded");
  console.log("==============================================");
}

seedTasks().catch(console.error);
