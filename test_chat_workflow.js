import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the built index.html
const htmlPath = path.resolve(__dirname, 'dist', 'index.html');
const fileUrl = `file://${htmlPath}`;

async function runChatWorkflowTest() {
  console.log("====================================================");
  console.log("STARTING LIVE CHAT-TO-TICKET CONVERSION E2E TEST");
  console.log(`URL: ${fileUrl}`);
  console.log("====================================================\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const screenshotDir = 'C:\\Users\\it\\.gemini\\antigravity\\brain\\7e356b58-1a96-49c1-92a6-d827e93e71f0';
  async function takeScreenshot(name) {
    try {
      await page.screenshot({ path: path.join(screenshotDir, name) });
      console.log(`✓ Screenshot saved: ${name}`);
    } catch (e) {
      console.log(`⚠ Failed to save screenshot ${name}: ${e.message}`);
    }
  }

  // Listen to browser console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });

  // STEP 1: Log in as Root (john@clickhub.com)
  console.log("STEP 1: Logging in as john@clickhub.com (Root)...");
  await page.goto(fileUrl);
  await page.waitForSelector('text=Welcome back!', { timeout: 5000 });
  await page.fill('input[placeholder="Email address"]', 'john@clickhub.com');
  await page.fill('input[placeholder="Password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForSelector('p:has-text("John Doe")', { timeout: 5000 });
  console.log("✓ Logged in successfully.");

  // STEP 2: Open Chat Widget and Send Message
  console.log("\nSTEP 2: Opening Chat Widget & sending message as Employee...");
  await page.click('button:has(svg.lucide-message-circle)');
  await page.waitForSelector('h3:has-text("IT Support Chat")', { timeout: 5000 });
  
  const startChatBtn = page.locator('button:has-text("Start Chat")');
  if (await startChatBtn.isVisible()) {
    await startChatBtn.click();
    await page.waitForSelector('text=Welcome John Doe!', { timeout: 5000 });
    console.log("✓ Chat session started.");
  } else {
    console.log("✓ Chat session already active.");
  }

  const uniqueMsg = `Monitor broken in Room 402 - Need replacement ASAP - ${Date.now()}`;
  await page.fill('input[placeholder="Type a message..."]', uniqueMsg);
  await page.click('button:has(svg.lucide-send)');
  await page.waitForSelector(`p:has-text("${uniqueMsg}")`, { timeout: 5000 });
  console.log("✓ Message sent successfully from chat widget.");
  await takeScreenshot('chat_step1_sent.png');

  // Minimize Chat widget
  await page.click('button:has(svg.lucide-minimize-2)');
  console.log("✓ Chat widget minimized.");

  // STEP 3: Navigate to Chat Admin Console and Claim Session
  console.log("\nSTEP 3: Navigating to Chat Admin Console to claim the session...");
  await page.click('button:has-text("Chat Admin")');
  await page.waitForSelector('h2:has-text("IT Support Console")', { timeout: 5000 });

  // Locate the John Doe chat session and select it
  await page.click('button:has-text("John Doe")');
  await page.waitForSelector('h3:has-text("John Doe")', { timeout: 5000 });

  console.log("Claiming the chat session...");
  const claimBtn = page.locator('button:has-text("Claim & Join Chat")').first();
  if (await claimBtn.isVisible()) {
    await claimBtn.click();
    await page.waitForTimeout(1000);
    console.log("✓ Chat session claimed.");
  } else {
    console.log("✓ Chat session already claimed.");
  }
  await takeScreenshot('chat_step2_claimed.png');

  // STEP 4: Convert Chat to Ticket
  console.log("\nSTEP 4: Converting active chat session to support Ticket...");
  await page.click('button:has-text("Convert to Ticket")');
  
  // Wait for conversion system message to appear in the console
  await page.waitForSelector('text=Percakapan ini telah dialihkan menjadi tiket bantuan resmi', { timeout: 10000 });
  console.log("✓ Chat successfully converted to ticket.");
  await takeScreenshot('chat_step3_converted.png');

  // STEP 5: Verify Ticket Created and displays Chat Log
  console.log("\nSTEP 5: Verifying created Ticket board...");
  await page.click('button:has-text("Tickets")');
  await page.waitForSelector('h1:has-text("Tickets")', { timeout: 5000 });
  
  // Wait for the ticket card
  const ticketCard = page.locator(`p:has-text("Chat Session with John Doe")`).first();
  await ticketCard.waitFor({ state: 'visible', timeout: 5000 });
  console.log("✓ Converted ticket is visible on the board.");

  // Open ticket details
  await ticketCard.click();
  await page.waitForSelector('h2:has-text("Chat Session with John Doe")', { timeout: 5000 });
  
  // Check if chat context is present inside description
  await page.waitForSelector(`text=Monitor broken in Room 402`, { timeout: 5000 });
  console.log("✓ Ticket details successfully contain full Chat Log.");
  await takeScreenshot('chat_step4_ticket_details.png');

  // Close ticket details
  await page.click('div.w-full.max-w-lg button:has(svg.lucide-x)');

  // STEP 6: Verify synced Task on Kanban Board
  console.log("\nSTEP 6: Navigating to Tasks to verify synced Task on Kanban...");
  await page.click('button:has-text("Home")');
  
  // Expand IT space and click IT Tasks list
  const itSpaceBtn = page.locator('span').filter({ hasText: /^IT$/ }).first();
  await itSpaceBtn.waitFor({ state: 'visible', timeout: 5000 });
  await itSpaceBtn.click();
  console.log("✓ IT Space clicked.");

  const itTasksListBtn = page.locator('button:has-text("IT Tasks")');
  await itTasksListBtn.waitFor({ state: 'visible', timeout: 5000 });
  await itTasksListBtn.click();
  console.log("✓ IT Tasks list clicked.");
  
  // Wait for the task card synced with ticket ID
  const taskCard = page.locator(`p:has-text("Chat Session with John Doe")`).first();
  await taskCard.waitFor({ state: 'visible', timeout: 5000 });
  console.log("✓ Synced task is visible on Kanban board.");
  await takeScreenshot('chat_step5_kanban_task.png');

  console.log("\n====================================================");
  console.log("🎉 CHAT-TO-TICKET WORKFLOW COMPLETED SUCCESSFULLY! 🎉");
  console.log("====================================================");

  await browser.close();
}

runChatWorkflowTest().catch(err => {
  console.error("Chat Workflow Test failed:", err);
  process.exit(1);
});
