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
  console.log(`Starting E2E test for Restrictions and Offline Handling`);
  console.log(`Target URL: ${fileUrl}`);
  console.log("====================================================\n");

  console.log("Cleaning up old active chat sessions for user-1 in staging database...");
  await supabase.from('ChatSession')
    .update({ status: 'CLOSED', updatedAt: new Date().toISOString() })
    .eq('employeeId', 'user-1')
    .neq('status', 'CLOSED');

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

  try {
    // ------------------------------------------------
    // STEP 1: Load Page & Verify Login Screen
    // ------------------------------------------------
    console.log("STEP 1: Loading page...");
    await page.goto(fileUrl);
    await page.waitForSelector('text=Welcome back!', { timeout: 15000 });
    console.log("✓ Login screen loaded.");

    // ------------------------------------------------
    // STEP 2: Demo Login (Employee Role - Charlie)
    // ------------------------------------------------
    console.log("STEP 2: Logging in as Charlie Davis (Employee)...");
    await page.click('button:has-text("Employee")');
    await page.waitForSelector('text=Charlie! 👋', { timeout: 15000 });
    console.log("✓ Logged in as Charlie Davis.");

    // ------------------------------------------------
    // STEP 3: Verify Employee Sidebar Restrictions
    // ------------------------------------------------
    console.log("STEP 3: Verifying sidebar restrictions for EMPLOYEE...");
    
    // Unrestricted items should be present
    await page.waitForSelector('button:has-text("Home")', { timeout: 5000 });
    await page.waitForSelector('button:has-text("Inbox")', { timeout: 5000 });
    await page.waitForSelector('button:has-text("My Tasks")', { timeout: 5000 });
    await page.waitForSelector('button:has-text("Tickets")', { timeout: 5000 });
    await page.waitForSelector('button:has-text("Knowledge")', { timeout: 5000 });

    // Restricted items should NOT exist
    const dashboards = await page.locator('button:has-text("Dashboards")').count();
    const assets = await page.locator('button:has-text("Assets")').count();
    const chatAdmin = await page.locator('button:has-text("Chat Admin")').count();
    const reports = await page.locator('button:has-text("Reports")').count();
    const checkout = await page.locator('button:has-text("Equipment Checkout")').count();
    const receipt = await page.locator('button:has-text("Goods Receipt")').count();
    const adminMenu = await page.locator('button:has-text("Admin")').count();

    if (dashboards > 0 || assets > 0 || chatAdmin > 0 || reports > 0 || checkout > 0 || receipt > 0 || adminMenu > 0) {
      throw new Error(`Restriction check failed! One or more restricted menus are visible to Employee: ` +
        `dashboards=${dashboards}, assets=${assets}, chatAdmin=${chatAdmin}, reports=${reports}, checkout=${checkout}, receipt=${receipt}, adminMenu=${adminMenu}`
      );
    }
    console.log("✓ Checked. Employee is correctly restricted from administrative views.");

    // ------------------------------------------------
    // STEP 4: Logout Charlie
    // ------------------------------------------------
    console.log("STEP 4: Logging out Charlie...");
    await page.click('button[title="Logout"]');
    await page.waitForSelector('text=Welcome back!', { timeout: 15000 });
    console.log("✓ Logged out Charlie.");

    // ------------------------------------------------
    // STEP 5: Login as John Doe (Root) to create an active chat session
    // ------------------------------------------------
    console.log("STEP 5: Logging in as John Doe (Root)...");
    await page.click('button:has-text("Root")');
    await page.waitForSelector('text=John! 👋', { timeout: 15000 });
    console.log("✓ Logged in as Root.");

    // Open chat widget and start chat session to ensure at least one session exists
    console.log("Initializing a chat session via Chat Widget...");
    await page.click('button:has(svg.lucide-message-circle)');
    await page.waitForSelector('h3:has-text("IT Support Chat")', { timeout: 15000 });
    
    const startChatBtn = page.locator('button:has-text("Start Chat")');
    if (await startChatBtn.isVisible()) {
      await startChatBtn.click();
      await page.waitForSelector('text=Welcome John Doe!', { timeout: 15000 });
      console.log("✓ Chat session initialized.");
    } else {
      console.log("✓ Chat session already active.");
    }

    // Send a message
    await page.fill('input[placeholder="Type a message..."]', 'Offline test message');
    await page.click('button:has(svg.lucide-send)');
    await page.waitForSelector('p:has-text("Offline test message")', { timeout: 15000 });
    console.log("✓ Test message sent.");

    // Minimize widget
    await page.click('button:has(svg.lucide-minimize-2)');
    console.log("✓ Chat widget minimized.");

    // ------------------------------------------------
    // STEP 6: Navigate to Chat Admin Console
    // ------------------------------------------------
    console.log("STEP 6: Navigating to Chat Admin Console...");
    await page.click('button:has-text("Chat Admin")');
    await page.waitForSelector('h2:has-text("IT Support Console")', { timeout: 15000 });
    console.log("✓ Chat Support Console loaded.");

    // Verify our session exists in sidebar list and select it
    console.log("Selecting John Doe session...");
    await page.click('button:has-text("John Doe")');
    await page.waitForSelector('h3:has-text("John Doe")', { timeout: 15000 });
    console.log("✓ Chat session for John Doe selected.");

    // Claim the session while online
    console.log("Claiming the chat session...");
    const claimBtn = page.locator('button:has-text("Claim Sesi"), button:has-text("Claim & Join Chat")');
    await claimBtn.first().click();
    await page.waitForSelector('input[placeholder^="Type your reply to"]', { timeout: 15000 });
    console.log("✓ Chat session claimed and input is visible.");

    // ------------------------------------------------
    // STEP 7: Simulate Offline Mode & Verify UI controls are disabled
    // ------------------------------------------------
    console.log("STEP 7: Setting Playwright Context to Offline...");
    await context.setOffline(true);

    // Verify offline banner is displayed
    console.log("Verifying offline warning banner...");
    await page.waitForSelector('#offline-banner', { timeout: 10000 });
    const bannerText = await page.locator('#offline-banner').innerText();
    if (!bannerText.includes("Koneksi Internet Terputus. Mode Baca Saja.")) {
      throw new Error(`Offline banner text is incorrect: "${bannerText}"`);
    }
    console.log("✓ Offline warning banner is visible with correct text.");

    // Verify input field is disabled and placeholder changed
    console.log("Verifying reply input is disabled...");
    await page.waitForSelector('input[placeholder="Mode Baca Saja (Offline)"]', { timeout: 5000 });
    const input = page.locator('input[placeholder="Mode Baca Saja (Offline)"]');
    const isInputDisabled = await input.isDisabled();
    if (!isInputDisabled) {
      throw new Error("Reply input text field is NOT disabled in offline mode!");
    }
    console.log("✓ Reply input field is correctly disabled.");

    // Verify action buttons are disabled when offline
    console.log("Verifying chat action buttons are disabled...");
    const actionButtons = page.locator('button:has-text("Convert to Ticket"), button:has-text("Close Session"), button:has-text("Claim Sesi"), button:has-text("Claim & Join Chat")');
    const actionCount = await actionButtons.count();
    for (let i = 0; i < actionCount; i++) {
      const btn = actionButtons.nth(i);
      if (await btn.isVisible()) {
        const isDisabled = await btn.isDisabled();
        const btnText = await btn.innerText();
        if (!isDisabled) {
          throw new Error(`Action button "${btnText}" is NOT disabled in offline mode!`);
        }
      }
    }
    console.log(`✓ All visible chat action buttons are correctly disabled.`);

    // ------------------------------------------------
    // STEP 8: Go Back Online & Verify Normal UI Resumes
    // ------------------------------------------------
    console.log("STEP 8: Restoring Playwright Context to Online...");
    await context.setOffline(false);

    // Verify offline banner goes away
    await page.waitForSelector('#offline-banner', { state: 'detached', timeout: 10000 });
    console.log("✓ Offline banner disappeared.");

    // Verify input field is re-enabled and placeholder reverted
    await page.waitForSelector('input[placeholder^="Type your reply to"]', { timeout: 5000 });
    const revertedInput = page.locator('input[placeholder^="Type your reply to"]');
    const isInputDisabledPost = await revertedInput.isDisabled();
    if (isInputDisabledPost) {
      throw new Error("Reply input text field is still disabled after restoring online status!");
    }
    console.log("✓ Reply input field is correctly re-enabled.");

    // Verify action buttons are re-enabled
    console.log("Verifying chat action buttons are re-enabled...");
    for (let i = 0; i < actionCount; i++) {
      const btn = actionButtons.nth(i);
      if (await btn.isVisible()) {
        const isDisabled = await btn.isDisabled();
        const btnText = await btn.innerText();
        if (isDisabled) {
          throw new Error(`Action button "${btnText}" is still disabled after restoring online status!`);
        }
      }
    }
    console.log("✓ Action buttons are successfully re-enabled.");

    console.log("\n🎉 ALL TESTS IN test_restrictions_offline.js PASSED SUCCESSFULLY!");
    await browser.close();
    process.exit(0);

  } catch (error) {
    console.error("\n✗ TEST RUN FAILED with error:", error);
    await browser.close();
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
