import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the built index.html
const htmlPath = path.resolve(__dirname, 'dist', 'index.html');
const fileUrl = `file://${htmlPath}`;

const supabaseUrl = 'https://hjgmrkgjstklrxcejlfk.supabase.co';
const correctKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqZ21ya2dqc3RrbHJ4Y2VqbGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDc4NDEsImV4cCI6MjA4NTkyMzg0MX0.GQNytFAqxL83-dct9pN-bu2Z5ROlSQwRKAqSuY0tY7s';
const supabase = createClient(supabaseUrl, correctKey);

async function runTest() {
  console.log("====================================================");
  console.log(`Starting DETAILED E2E test for: ${fileUrl}`);
  console.log("====================================================\n");

  // Clean up any existing active open sessions for the test user to guarantee clean test state
  console.log("Cleaning up old active chat sessions for user-1 in staging database...");
  await supabase.from('ChatSession')
    .update({ status: 'CLOSED', updatedAt: new Date().toISOString() })
    .eq('employeeId', 'user-1')
    .neq('status', 'CLOSED');

  console.log("Cleaning up old test spaces and assets in staging database...");
  try {
    await supabase.from('Asset').delete().eq('serialNumber', 'MBA-M3-12345');
    const { data: spacesToDelete } = await supabase.from('Space').select('id').eq('name', 'Product Launch');
    if (spacesToDelete && spacesToDelete.length > 0) {
      const spaceIds = spacesToDelete.map(s => s.id);
      const { data: tasksToDelete } = await supabase.from('Task').select('id').in('spaceId', spaceIds);
      if (tasksToDelete && tasksToDelete.length > 0) {
        const taskIds = tasksToDelete.map(t => t.id);
        await supabase.from('Checklist').delete().in('taskId', taskIds);
        await supabase.from('Comment').delete().in('ticketId', taskIds);
      }
      await supabase.from('Task').delete().in('spaceId', spaceIds);
      await supabase.from('TaskList').delete().in('spaceId', spaceIds);
      await supabase.from('Space').delete().in('id', spaceIds);
    }
    console.log("✓ Staging database test data cleaned up.");
  } catch (err) {
    console.error("Warning: Staging database cleanup failed:", err.message);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to browser console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.error(`[BROWSER RUNTIME EXCEPTION] ${err.message}`);
    process.exit(1);
  });

  // ------------------------------------------------
  // STEP 1: Load Page & Verify Login Screen
  // ------------------------------------------------
  console.log("STEP 1: Loading page...");
  await page.goto(fileUrl);
  await page.waitForSelector('text=Welcome back!', { timeout: 15000 });
  console.log("✓ Login screen loaded.");

  // ------------------------------------------------
  // STEP 2: Demo Login (Root Role)
  // ------------------------------------------------
  await page.fill('input[placeholder="Email address"]', 'john@clickhub.com');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=John! 👋', { timeout: 15000 });
  console.log("✓ Logged in successfully.");

  // ------------------------------------------------
  // STEP 3: Settings Modal & Tag Management
  // ------------------------------------------------
  console.log("STEP 3: Testing Settings Modal and Tags...");
  // Open Settings Modal by clicking the Settings button in the sidebar
  await page.click('div.w-60 button:has-text("Settings")');
  await page.waitForSelector('h2:has-text("Settings")', { timeout: 15000 });
  console.log("✓ Settings modal opened.");

  // Switch to Tags Tab
  await page.click('div.w-40 button:has-text("Tags")');
  await page.waitForSelector('h3:has-text("Manage Tags")', { timeout: 15000 });
  console.log("✓ Navigated to Tags tab.");

  // Create a new Tag
  try {
    await page.click('button:has-text("Add Tag")');
    await page.fill('input[placeholder="Tag name..."]', 'Marketing');
    await page.press('input[placeholder="Tag name..."]', 'Enter');
    await page.waitForSelector('span:has-text("Marketing")', { timeout: 5000 });
    console.log("✓ New tag 'Marketing' created successfully.");
  } catch (err) {
    console.error("Tag creation failed! Taking debug screenshot...");
    try {
      await page.screenshot({ path: 'C:\\Users\\it\\.gemini\\antigravity\\brain\\a4ee7fa3-4fd9-4196-adfd-39f6896b0773/debug_tags_failed.png' });
      console.error("Debug screenshot saved to brain folder.");
      const modalContent = await page.innerText('body');
      console.error("Body content on failure:\n", modalContent);
    } catch (e) {
      console.error("Failed to take screenshot/read body:", e.message);
    }
    throw err;
  }

  // Close Settings Modal by clicking the X button in the modal header
  await page.click('h2:has-text("Settings") >> xpath=.. >> button');
  await page.waitForSelector('h2:has-text("Settings")', { state: 'detached', timeout: 15000 });
  console.log("✓ Settings modal closed.");

  // ------------------------------------------------
  // STEP 4: Space & Task Creation (ClickHub)
  // ------------------------------------------------
  console.log("STEP 4: Testing Project Management (ClickHub)...");
  
  // Click '+' to add a Space using the button next to "Spaces" p tag
  await page.click('p:has-text("Spaces") >> xpath=.. >> button');
  await page.fill('input[placeholder="Space name..."]', 'Product Launch');
  await page.press('input[placeholder="Space name..."]', 'Enter');
  await page.waitForSelector('span:has-text("Product Launch")', { timeout: 15000 });
  console.log("✓ New Space 'Product Launch' created.");

  // Click on the Product Launch Space to select it
  await page.click('span:has-text("Product Launch")');
  
  // Create a new List in the Space
  await page.locator('div:has(> button:has-text("Product Launch"))').locator('button:has-text("New List")').click();
  await page.fill('input[placeholder="List name..."]', 'Tasks Plan');
  await page.press('input[placeholder="List name..."]', 'Enter');
  await page.waitForSelector('span:has-text("Tasks Plan")', { timeout: 15000 });
  console.log("✓ New List 'Tasks Plan' created.");

  // Click on the newly created List in the sidebar to select it
  await page.click('span:has-text("Tasks Plan")');
  console.log("✓ Selected list 'Tasks Plan'.");

  // Add a Task using the CreateTaskModal (clicking the violet New Task button in the header)
  console.log("Adding a new task via modal...");
  await page.click('button.bg-violet-600:has-text("New Task")');
  await page.waitForSelector('h2:has-text("Create New Task")', { timeout: 15000 });

  await page.fill('input[placeholder="Enter task title..."]', 'Write launch announcement');
  await page.fill('textarea[placeholder="Add description..."]', 'Write marketing announcement for social channels.');
  await page.click('button:has-text("Create Task")');

  // Verify task appears on the board
  await page.waitForSelector('p:has-text("Write launch announcement")', { timeout: 15000 });
  console.log("✓ Task 'Write launch announcement' created and verified on Board.");

  // Open Task details
  console.log("Opening task details modal...");
  await page.click('p:has-text("Write launch announcement")');
  await page.waitForSelector('h2:has-text("Write launch announcement")', { timeout: 15000 });
  console.log("✓ Task detail modal opened.");

  // Add a subtask
  console.log("Adding subtask...");
  await page.fill('input[placeholder="Add subtask..."]', 'Review marketing materials');
  await page.click('input[placeholder="Add subtask..."] >> xpath=.. >> button');
  await page.waitForSelector('span:has-text("Review marketing materials")', { timeout: 15000 });
  console.log("✓ Subtask added.");

  // Add a comment
  console.log("Adding comment...");
  await page.fill('input[placeholder="Write a comment..."]', 'This is a test comment');
  await page.click('button:has-text("Send")');
  await page.waitForSelector('p:has-text("This is a test comment")', { timeout: 15000 });
  console.log("✓ Comment added successfully.");

  // Close Task Detail Modal (X button inside the max-w-3xl modal)
  await page.click('div.max-w-3xl button:has(svg.lucide-x)');
  await page.waitForSelector('h2:has-text("Write launch announcement")', { state: 'detached', timeout: 15000 });
  console.log("✓ Task detail modal closed.");

  // ------------------------------------------------
  // STEP 5: IT Tickets (NexHub)
  // ------------------------------------------------
  console.log("STEP 5: Testing Ticket System...");
  await page.click('button:has-text("Tickets")');
  await page.waitForSelector('text=Tickets', { timeout: 15000 });
  
  // Click New Ticket
  await page.click('button:has-text("New Ticket")');
  await page.waitForSelector('h2:has-text("Create New Ticket")', { timeout: 15000 });

  // Target inputs specifically inside the Ticket modal container
  const ticketModal = page.locator('div.w-full.max-w-lg:has(h2:has-text("Create New Ticket"))');
  await ticketModal.locator('input[placeholder="Ticket title..."]').fill('Staging server offline');
  await ticketModal.locator('textarea[placeholder="Description..."]').fill('Staging server is not reachable on port 443.');
  
  // Select Critical priority (first select) and Server category (second select)
  await ticketModal.locator('select').nth(0).selectOption('CRITICAL');
  await ticketModal.locator('select').nth(1).selectOption('Server');

  // Submit modal
  await ticketModal.locator('button:has-text("Create")').click();
  
  // Verify critical ticket is shown
  await page.waitForSelector('p:has-text("Staging server offline")', { timeout: 15000 });
  console.log("✓ Ticket 'Staging server offline' created and verified on Ticket board.");

  // ------------------------------------------------
  // STEP 6: Asset Management (NexHub)
  // ------------------------------------------------
  console.log("STEP 6: Testing Asset Management...");
  await page.click('button:has-text("Assets")');
  await page.waitForSelector('text=Assets', { timeout: 15000 });

  // Add new Asset
  await page.click('button:has-text("Add Asset")');
  await page.waitForSelector('h2:has-text("Add New Asset")', { timeout: 15000 });

  // Target inputs specifically inside the Asset modal container
  const assetModal = page.locator('div.w-full.max-w-lg:has(h2:has-text("Add New Asset"))');
  await assetModal.locator('input[placeholder="Asset name *"]').fill('MacBook Air M3');
  await assetModal.locator('input[placeholder="Brand"]').fill('Apple');
  await assetModal.locator('select').first().selectOption('Laptop');
  await assetModal.locator('input[placeholder="Serial Number"]').fill('MBA-M3-12345');
  await assetModal.locator('input[placeholder="Location"]').fill('IT Desk');
  await assetModal.locator('input[placeholder="Price"]').fill('18000000');
  await assetModal.locator('input[placeholder="Vendor"]').fill('iBox');

  // Submit modal
  await assetModal.locator('button:has-text("Add Asset")').click();

  // Verify newly created asset appears in listing
  await page.waitForSelector('span:has-text("MacBook Air M3")', { timeout: 15000 });
  console.log("✓ IT Asset 'MacBook Air M3' added and verified in inventaris list.");

  // ------------------------------------------------
  // STEP 7: Chat Support Widget
  // ------------------------------------------------
  console.log("STEP 7: Testing Chat Widget...");
  // Click Chat support button (bottom-right circle button)
  await page.click('button:has(svg.lucide-message-circle)');
  await page.waitForSelector('h3:has-text("IT Support Chat")', { timeout: 15000 });
  console.log("✓ Chat widget expanded.");

  // Start chat session if not already active
  const startChatBtn = page.locator('button:has-text("Start Chat")');
  if (await startChatBtn.isVisible()) {
    await startChatBtn.click();
    await page.waitForSelector('text=Welcome John Doe!', { timeout: 15000 });
    console.log("✓ Chat session initialized.");
  } else {
    console.log("✓ Chat session already active, continuing...");
  }

  // Send a chat message
  await page.fill('input[placeholder="Type a message..."]', 'I need help setting up my VPN credentials.');
  await page.click('button:has(svg.lucide-send)');
  await page.waitForSelector('p:has-text("I need help setting up my VPN credentials.")', { timeout: 15000 });
  console.log("✓ Message sent successfully.");

  // Wait for the simulated automated agent response (usually within 1.5 seconds)
  console.log("Waiting for simulated agent response...");
  const agentMsgSelector = 'div.bg-gray-800.text-gray-300 p.text-xs';
  await page.waitForSelector(agentMsgSelector, { timeout: 15000 });
  const text = await page.locator(agentMsgSelector).first().innerText();
  console.log(`✓ Received mock support reply: "${text}"`);

  // Close Chat widget using its close button in header
  await page.click('button:has(svg.lucide-minimize-2)');
  console.log("✓ Chat widget minimized.");

  // ------------------------------------------------
  // STEP 8: Logout
  // ------------------------------------------------
  console.log("STEP 8: Testing Logout...");
  await page.click('button[title="Logout"]');
  await page.waitForSelector('text=Welcome back!', { timeout: 15000 });
  console.log("✓ Session terminated and returned to login screen.");

  console.log("\n====================================================");
  console.log("🎉 ALL MULTI-MENU INTERACTIVE TESTS PASSED SUCCESSFULLY! 🎉");
  console.log("====================================================");

  await browser.close();
}

runTest().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
