import { chromium } from 'playwright';
import pathLib from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathLib.dirname(__filename);

// Path to the built index.html
const htmlPath = pathLib.resolve(__dirname, 'dist', 'index.html');
const fileUrl = `file://${htmlPath}`;

const supabaseUrl = 'https://hjgmrkgjstklrxcejlfk.supabase.co';
const correctKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ21ya2dqc3RrbHJ4Y2VqbGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDc4NDEsImV4cCI6MjA4NTkyMzg0MX0.GQNytFAqxL83-dct9pN-bu2Z5ROlSQwRKAqSuY0tY7s';
const supabase = createClient(supabaseUrl, correctKey);

async function runWorkflowTest() {
  console.log("====================================================");
  console.log("STARTING DETAILED WORKFLOW E2E TEST (IT OPERATIONS)");
  console.log(`URL: ${fileUrl}`);
  console.log("====================================================\n");

  console.log("Cleaning up old test tickets in staging database...");
  try {
    const { data: ticketsToDelete } = await supabase.from('Ticket')
      .select('id')
      .or('title.ilike.CSAT Test Ticket -%,title.ilike.Printer offline Floor 3 -%');
    
    if (ticketsToDelete && ticketsToDelete.length > 0) {
      const ticketIds = ticketsToDelete.map(t => t.id);
      const { data: tasksToDelete } = await supabase.from('Task')
        .select('id')
        .in('ticketId', ticketIds);
      
      if (tasksToDelete && tasksToDelete.length > 0) {
        const taskIds = tasksToDelete.map(t => t.id);
        await supabase.from('Checklist').delete().in('taskId', taskIds);
        await supabase.from('Comment').delete().in('ticketId', taskIds);
        await supabase.from('PartRequest').delete().in('taskId', taskIds);
      }
      await supabase.from('PartRequest').delete().in('ticketId', ticketIds);
      await supabase.from('Task').delete().in('ticketId', ticketIds);
      await supabase.from('Ticket').delete().in('id', ticketIds);
    }
    
    // Clean up direct bon requests
    await supabase.from('PartRequest').delete()
      .eq('notes', 'Direct wiring')
      .eq('requestedBy', 'user-tech-001');

    // Clean up restock requests
    await supabase.from('StockRequest').delete()
      .eq('reason', 'Procuring stock for floor cabling')
      .eq('requestedById', 'user-tech-001');

    console.log("✓ Staging database test tickets, bon requests, and restock requests cleaned up.");
  } catch (err) {
    console.error("Warning: Staging database cleanup failed:", err.message);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 }
  });
  const page = await context.newPage();

  const screenshotDir = 'C:\\Users\\it\\.gemini\\antigravity\\brain\\dfa057c6-5938-48aa-9738-6d0e838b40c0';
  async function takeScreenshot(name) {
    try {
      await page.screenshot({ path: pathLib.join(screenshotDir, name), fullPage: true });
      console.log(`✓ Screenshot saved: ${name}`);
    } catch (e) {
      console.log(`⚠ Failed to save screenshot ${name}: ${e.message}`);
    }
  }

  async function waitForSyncQueueToEmpty() {
    console.log("Waiting for sync queue to empty in localStorage...");
    try {
      await page.waitForFunction(() => {
        try {
          const dataStr = localStorage.getItem('clickhub-storage');
          if (!dataStr) return true;
          const parsed = JSON.parse(dataStr);
          const queue = parsed?.state?.syncQueue;
          return !queue || queue.length === 0;
        } catch (e) {
          return false;
        }
      }, null, { timeout: 15000 });
      console.log("✓ Sync queue is empty.");
    } catch (err) {
      console.warn("Warning: Timeout waiting for sync queue to empty:", err.message);
    }
  }

  // Listen to browser console errors and dialogs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    } else {
      console.log(`[BROWSER LOG] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER EXCEPTION] ${err.message}`);
    process.exit(1);
  });

  page.on('dialog', async dialog => {
    console.log(`[BROWSER DIALOG] ${dialog.type()}: ${dialog.message()}`);
    await dialog.accept();
  });

  // ------------------------------------------------
  // STEP 1: Log in as Employee (Charlie Davis) & Create Ticket
  // ------------------------------------------------
  console.log("\nSTEP 1: Logging in as Employee to create a ticket...");
  await page.goto(fileUrl);
  await page.waitForSelector('text=Welcome back!', { timeout: 15000 });
  
  // Clear localStorage to reset Zustand persisted syncQueue and avoid key conflicts
  await page.evaluate(() => localStorage.clear());
  await page.goto(fileUrl); // Reload
  await page.waitForSelector('text=Welcome back!', { timeout: 15000 });

  await page.fill('input[placeholder="Email address"]', 'employee-test@ithub.com');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Test! 👋', { timeout: 15000 });
  console.log("✓ Logged in as Employee (Test Employee).");

  await page.click('button:has-text("Tickets")');
  await page.waitForSelector('h1:has-text("Tickets")', { timeout: 15000 });

  await page.click('.btn-new-ticket');
  await page.waitForSelector('h2:has-text("Create New Ticket")', { timeout: 15000 });

  const uniqueTicketTitle = `CSAT Test Ticket - ${Date.now()}`;
  const createModal = page.locator('div.w-full.max-w-lg:has(h2:has-text("Create New Ticket"))');
  await createModal.locator('input[placeholder="Ticket title..."]').fill(uniqueTicketTitle);
  await createModal.locator('textarea[placeholder="Description..."]').fill("Network router configuration issue in conference room.");
  await createModal.locator('select').first().selectOption('HIGH');
  await createModal.locator('select').nth(1).selectOption('Network');
  await createModal.locator('select').nth(2).selectOption(''); // Unassigned initially
  await createModal.locator('button:has-text("Create")').click();

  // Verify ticket was added on board
  await page.waitForSelector(`p:has-text("${uniqueTicketTitle}")`, { timeout: 15000 });
  console.log(`✓ Ticket "${uniqueTicketTitle}" successfully created by Employee.`);
  await waitForSyncQueueToEmpty();
  await takeScreenshot('step1_employee_ticket_created.png');

  // Logout Employee
  await page.click('button[title="Logout"]');
  await page.waitForSelector('text=Welcome back!', { timeout: 15000 });
  console.log("✓ Logged out Employee.");

  // ------------------------------------------------
  // STEP 2: Log in as Technician & Add Subtask & Request Spares
  // ------------------------------------------------
  console.log("\nSTEP 2: Logging in as Technician to inspect ticket & request parts...");
  await page.fill('input[placeholder="Email address"]', 'tech@ithub.com');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('p:has-text("Teknisi Test")', { timeout: 15000 });
  console.log("✓ Logged in as Technician (Teknisi Test).");

  await page.click('button:has-text("Tickets")');
  await page.waitForSelector('h1:has-text("Tickets")', { timeout: 15000 });

  // Open the newly created ticket details
  await page.click(`p:has-text("${uniqueTicketTitle}")`);
  await page.waitForSelector(`h2:has-text("${uniqueTicketTitle}")`, { timeout: 15000 });

  // Add a Sub-task
  await page.click('button:has-text("Add Sub-task")');
  await page.waitForSelector('input[placeholder="Task title..."]', { state: 'visible', timeout: 15000 });
  const uniqueSubtaskTitle = `Check ethernet ports - ${Date.now()}`;
  await page.fill('input[placeholder="Task title..."]', uniqueSubtaskTitle);

  // Assign to technician
  const assignSelect = page.locator('select:has(option:has-text("Assign to..."))');
  await assignSelect.selectOption(''); // Keep unassigned to claim it
  await page.locator('button', { hasText: /^Add$/ }).click();

  // Verify sub-task appears
  await page.waitForSelector(`span:has-text("${uniqueSubtaskTitle}")`, { timeout: 15000 });
  console.log("✓ Sub-task created under Ticket.");

  // Claim sub-task & Request parts
  await page.click(`span:has-text("${uniqueSubtaskTitle}")`);
  await page.waitForSelector(`h2:has-text("${uniqueSubtaskTitle}")`, { timeout: 15000 });
  await page.click('button:has-text("Claim Task")');
  
  await page.click('button:has-text("Request Part")');
  await page.waitForSelector('select:has(option:has-text("Select Part..."))', { timeout: 15000 });
  const rj45Value = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('select')).find(sel => sel.innerText.includes('Select Part...'));
    if (!s) return 'SELECT_NOT_FOUND';
    const opts = Array.from(s.options).map(o => o.text);
    console.log("LOG_PART_OPTIONS: " + JSON.stringify(opts));
    const opt = Array.from(s.options).find(o => o.text.includes('RJ45 Connector Panduit') || o.text.includes('RJ45 Connector'));
    return opt ? opt.value : 'RJ45_NOT_FOUND';
  });
  console.log(`Resolved RJ45 Option Value: "${rj45Value}"`);
  if (rj45Value === 'SELECT_NOT_FOUND' || rj45Value === 'RJ45_NOT_FOUND') {
    throw new Error(`Failed to find RJ45 option in dropdown. Value was: ${rj45Value}`);
  }
  await page.selectOption('select:has(option:has-text("Select Part..."))', rj45Value);
  await page.fill('input[type="number"]', '5');
  await page.fill('input[placeholder="e.g. For replacement"]', 'RJ45 plugs for crimping');
  await page.locator('button', { hasText: /^Request$/ }).click();

  // Verify part request pending
  await page.waitForSelector('span:has-text("PENDING")', { timeout: 15000 });
  console.log("✓ Part request created.");

  // Close Task Details
  await page.click('div.max-w-3xl button:has(svg.lucide-x)');

  // ------------------------------------------------
  // STEP 3: Direct Bon & Purchase Requests
  // ------------------------------------------------
  console.log("\nSTEP 3: Submitting Direct Bon & Restock requests...");
  await page.click('button:has-text("Assets")');
  await page.click('button:has-text("Inventory / Spare Parts")');
  await page.waitForTimeout(1000);

  // Submit Direct Bon
  await page.click('button:has-text("Form Bon Barang")');
  await page.waitForSelector('h2:has-text("Direct Bon Request")', { timeout: 15000 });
  await page.waitForSelector('select:has(option:has-text("Select Part..."))', { timeout: 15000 });
  const directUtpValue = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('select')).find(sel => sel.innerText.includes('Select Part...'));
    if (!s) return 'SELECT_NOT_FOUND';
    const opt = Array.from(s.options).find(o => o.text.includes('UTP Cat6 Cable'));
    return opt ? opt.value : 'UTP_NOT_FOUND';
  });
  console.log(`Resolved Direct UTP Option Value: "${directUtpValue}"`);
  if (directUtpValue === 'SELECT_NOT_FOUND' || directUtpValue === 'UTP_NOT_FOUND') {
    throw new Error(`Failed to find UTP option in direct bon dropdown. Value was: ${directUtpValue}`);
  }
  await page.selectOption('select:has(option:has-text("Select Part..."))', directUtpValue);
  await page.fill('input[type="number"]', '1');
  await page.fill('input[placeholder="e.g. Server Room D"]', 'Direct wiring');
  await page.click('button:has-text("Submit Request")');
  console.log("✓ Direct Bon submitted.");

  // Submit restock
  await page.click('button:has-text("Ajukan Pengadaan Barang")');
  await page.waitForSelector('h2:has-text("Purchase / Restock Request")', { timeout: 15000 });
  await page.check('input[type="radio"]');
  await page.waitForSelector('select:has(option:has-text("Select Item..."))', { timeout: 15000 });
  const restockUtpValue = await page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('select')).find(sel => sel.innerText.includes('Select Item...'));
    if (!s) return 'SELECT_NOT_FOUND';
    const opt = Array.from(s.options).find(o => o.text.includes('UTP Cat6 Cable'));
    return opt ? opt.value : 'UTP_NOT_FOUND';
  });
  console.log(`Resolved Restock UTP Option Value: "${restockUtpValue}"`);
  if (restockUtpValue === 'SELECT_NOT_FOUND' || restockUtpValue === 'UTP_NOT_FOUND') {
    throw new Error(`Failed to find UTP option in restock dropdown. Value was: ${restockUtpValue}`);
  }
  await page.selectOption('select:has(option:has-text("Select Item..."))', restockUtpValue);
  await page.fill('input[type="number"]', '5');
  await page.fill('input[placeholder="e.g. 500000"]', '1000000');
  await page.fill('textarea[placeholder="Why do we need this item/restock?"]', 'Procuring stock for floor cabling');
  await page.click('button:has-text("Submit Request")');
  console.log("✓ Restock purchase request submitted.");
  
  await waitForSyncQueueToEmpty();

  await page.click('button[title="Logout"]');
  await page.waitForSelector('text=Welcome back!', { timeout: 15000 });

  // ------------------------------------------------
  // STEP 4: Log in as Manager to Approve Requests
  // ------------------------------------------------
  console.log("\nSTEP 4: Logging in as Manager to approve requests...");
  await page.fill('input[placeholder="Email address"]', 'manager@ithub.com');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('p:has-text("Manager Test")', { timeout: 15000 });
  console.log("✓ Logged in as Manager.");

  await page.click('button:has-text("Assets")');
  await page.click('button:has-text("Requests")');
  await page.waitForSelector('h2:has-text("Permintaan Bon Barang")', { timeout: 15000 });

  const partRequestsContainer = page.locator('#part-requests-container');
  const stockRequestsContainer = page.locator('#stock-requests-container');

  // Approve RJ45 Request
  console.log("Approving Part Request for RJ45...");
  const rj45Card = partRequestsContainer.locator('div.rounded-xl:has(span:has-text("RJ45 Connector Panduit")):has(button:has-text("Approve"))').first();
  await rj45Card.locator('button:has-text("Approve")').first().click();
  // Wait for the card's status to change to APPROVED
  await partRequestsContainer.locator('div.rounded-xl:has(span:has-text("RJ45 Connector Panduit")):has(span:has-text("APPROVED"))').first().waitFor({ state: 'visible', timeout: 15000 });
  console.log("✓ RJ45 approved.");

  // Approve UTP Direct Bon
  console.log("Approving Direct Bon Request for UTP Cable...");
  const utpCard = partRequestsContainer.locator('div.rounded-xl:has(span:has-text("UTP Cat6 Cable")):has(button:has-text("Approve & Deduct Stock"))').first();
  await utpCard.locator('button:has-text("Approve & Deduct Stock")').first().click();
  // Wait for the card's status to change to APPROVED
  await partRequestsContainer.locator('div.rounded-xl:has(span:has-text("UTP Cat6 Cable")):has(span:has-text("APPROVED"))').first().waitFor({ state: 'visible', timeout: 15000 });
  console.log("✓ UTP approved.");

  // Approve restock
  console.log("Approving restock...");
  const restockCard = stockRequestsContainer.locator('div.rounded-xl:has(span:has-text("UTP Cat6 Cable")):has(button:has-text("Approve"))').first();
  await restockCard.locator('button:has-text("Approve")').first().click();
  
  // Wait for the "Mark Received" button to appear on the card that has it
  const activeRestockCard = stockRequestsContainer.locator('div.rounded-xl:has(span:has-text("UTP Cat6 Cable")):has(button:has-text("Mark Received"))').first();
  await activeRestockCard.locator('button:has-text("Mark Received")').first().click();
  
  // Wait for status to become RECEIVED
  await stockRequestsContainer.locator('div.rounded-xl:has(span:has-text("UTP Cat6 Cable")):has(span:has-text("RECEIVED"))').first().waitFor({ state: 'visible', timeout: 15000 });
  console.log("✓ Restock approved and received.");

  await page.click('button[title="Logout"]');
  await page.waitForSelector('text=Welcome back!', { timeout: 15000 });

  // ------------------------------------------------
  // STEP 5: Log in as Technician & Resolve Ticket & Publish to KB
  // ------------------------------------------------
  console.log("\nSTEP 5: Logging in as Technician to resolve ticket...");
  await page.fill('input[placeholder="Email address"]', 'tech@ithub.com');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('p:has-text("Teknisi Test")', { timeout: 15000 });

  await page.click('button:has-text("Tickets")');
  await page.waitForSelector('h1:has-text("Tickets")', { timeout: 15000 });

  await page.click(`p:has-text("${uniqueTicketTitle}")`);
  await page.waitForSelector(`h2:has-text("${uniqueTicketTitle}")`, { timeout: 15000 });

  // Update Status to RESOLVED
  const statusSelect = page.locator('select:has(option:has-text("Resolved"))');
  await statusSelect.selectOption('RESOLVED');
  console.log("✓ Ticket status updated to RESOLVED.");
  await page.waitForTimeout(3000); // Wait for direct Supabase status update write to complete

  // Enter Resolution Notes
  const resolutionTextarea = page.locator('textarea[placeholder^="Tuliskan bagaimana masalah"]');
  await resolutionTextarea.fill("Replaced broken cable joints and updated router firmware.");
  // Lose focus from textarea to ensure any UI state transitions complete
  await page.keyboard.press('Tab');
  await page.waitForTimeout(3000); // Wait for direct Supabase resolution update write to complete

  // Publish to KB
  await page.click('button:has-text("Terbitkan ke KB")');
  console.log("✓ Clicked Terbitkan ke KB button (KB draft generated).");
  await waitForSyncQueueToEmpty();
  await takeScreenshot('step5_ticket_resolved.png');

  // Close ticket modal
  await page.click('div.max-w-lg button:has-text("Close"), div.max-w-lg button:has(svg.lucide-x)');

  // Logout Technician
  await page.click('button[title="Logout"]');
  await page.waitForSelector('text=Welcome back!', { timeout: 15000 });

  // ------------------------------------------------
  // STEP 6: Log in as Employee & Rate CSAT
  // ------------------------------------------------
  await page.fill('input[placeholder="Email address"]', 'employee-test@ithub.com');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Test! 👋', { timeout: 15000 });
  console.log("✓ Logged in as Employee (Test Employee).");

  await page.click('button:has-text("Tickets")');
  await page.waitForSelector('h1:has-text("Tickets")', { timeout: 15000 });

  // Open resolved ticket
  await page.click(`p:has-text("${uniqueTicketTitle}")`);
  await page.waitForSelector(`h2:has-text("${uniqueTicketTitle}")`, { timeout: 15000 });

  // Verify CSAT widget is visible
  await page.waitForSelector('h3:has-text("Kepuasan Layanan (CSAT)")', { timeout: 15000 });
  
  // Click 5th star
  await page.click('.btn-star-rating >> nth=4');
  
  // Enter feedback comment
  await page.fill('.csat-comment-textarea', "Amazing speed and excellent execution by the technician. Very satisfied!");
  
  // Submit CSAT
  await page.click('.btn-submit-csat');
  console.log("✓ CSAT submitted successfully by Employee.");
  
  // Verify read-only CSAT stars are rendered
  await page.waitForSelector('div.text-amber-400', { timeout: 15000 });
  await waitForSyncQueueToEmpty();
  await takeScreenshot('step6_employee_csat_submitted.png');

  // Close ticket modal
  await page.click('div.max-w-lg button:has-text("Close"), div.max-w-lg button:has(svg.lucide-x)');

  // Logout Employee
  await page.click('button[title="Logout"]');
  await page.waitForSelector('text=Welcome back!', { timeout: 15000 });

  // ------------------------------------------------
  // STEP 7: Log in as Manager & Verify CSAT Report & Bulk Print
  // ------------------------------------------------
  console.log("\nSTEP 7: Logging in as Manager to check reports & bulk print...");
  await page.fill('input[placeholder="Email address"]', 'manager@ithub.com');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('p:has-text("Manager Test")', { timeout: 15000 });

  // Go to Reports
  await page.click('button:has-text("Reports")');
  await page.waitForSelector('h1:has-text("Reports & Analytics Center")', { timeout: 15000 });

  // Verify CSAT average value is rendered
  await page.waitForSelector('.csat-average-val', { timeout: 15000 });
  const avgCsatText = await page.locator('.csat-average-val').innerText();
  console.log(`✓ Verified CSAT Average Rating: ${avgCsatText}`);

  // Verify CSAT feedback item is in list
  await page.waitForSelector('.csat-feedback-item', { timeout: 15000 });
  const feedbackItemText = await page.locator('.csat-feedback-item').first().innerText();
  console.log(`✓ Verified Recent Feedback entry:\n${feedbackItemText}`);
  await takeScreenshot('step7_manager_reports_view.png');

  // Verify CAPEX Report
  console.log("Checking Depreciation & CAPEX tab...");
  await page.click('#report-capex-tab-btn');
  await page.waitForSelector('#report-capex-container', { timeout: 15000 });
  console.log("✓ Verified Depreciation & CAPEX report container is visible.");
  await takeScreenshot('step7_capex_report_view.png');

  // Go to Assets Page
  await page.click('button:has-text("Assets")');
  await page.waitForSelector('h1:has-text("IT Resources & Inventory")', { timeout: 15000 });

  // Open asset detail and add a maintenance schedule
  console.log("Opening first asset detail modal...");
  await page.click('div.relative.group button');
  await page.waitForSelector('#asset-detail-modal-overlay', { timeout: 15000 });

  console.log("Switching to Maintenance tab...");
  await page.click('#asset-maintenance-tab-btn');
  await page.waitForSelector('text=Jadwal Perawatan (PM)', { timeout: 15000 });

  console.log("Creating new maintenance schedule...");
  await page.click('#add-pm-schedule-btn');
  await page.waitForSelector('#pm-title-input', { timeout: 15000 });

  const pmTitle = `Routine Maintenance - ${Date.now()}`;
  await page.fill('#pm-title-input', pmTitle);
  await page.selectOption('#pm-frequency-select', 'MONTHLY');
  await page.fill('#pm-date-input', '2026-07-08');
  await page.click('#save-pm-schedule-btn');

  console.log("Verifying scheduled PM in DOM...");
  await page.waitForSelector(`p:has-text("${pmTitle}")`, { timeout: 15000 });
  console.log(`✓ Maintenance "${pmTitle}" successfully scheduled.`);
  await takeScreenshot('step7_asset_maintenance_scheduled.png');

  // Close detail modal
  await page.click('#asset-detail-modal-overlay button:has(svg.lucide-x)');

  // Check multiple assets checkboxes
  console.log("Selecting multiple assets for label printing...");
  const assetCards = page.locator('div.relative.group');
  const checkboxCount = await assetCards.count();
  if (checkboxCount >= 2) {
    await assetCards.nth(0).locator('input[type="checkbox"]').check();
    await assetCards.nth(1).locator('input[type="checkbox"]').check();
  } else if (checkboxCount === 1) {
    await assetCards.nth(0).locator('input[type="checkbox"]').check();
  }
  
  // Trigger printing and wait for popup
  console.log("Triggering bulk print selected labels...");
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 15000 }),
    page.click('#print-selected-labels-btn')
  ]);
  
  await popup.waitForLoadState();
  const popupTitle = await popup.title();
  console.log(`✓ Popup opened successfully. Title: "${popupTitle}"`);
  await popup.close();

  console.log("\n====================================================");
  console.log("🎉 ALL WORKFLOW SCENARIOS EXECUTED SUCCESSFULLY! 🎉");
  console.log("====================================================");

  await browser.close();
}

runWorkflowTest().catch(err => {
  console.error("Workflow Test failed:", err);
  process.exit(1);
});
