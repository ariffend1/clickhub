import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Staging directory for screenshots (artifacts directory)
const outputDir = 'C:/Users/it/.gemini/antigravity/brain/0b0fab52-1d45-405c-af06-64b73d1996da/';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Dev server URL
const appUrl = 'http://localhost:5173';

async function runVisualTest() {
  console.log("====================================================");
  console.log(`Starting VISUAL E2E test for ClickHub flows`);
  console.log(`Target URL: ${appUrl}`);
  console.log(`Saving screenshots to: ${outputDir}`);
  console.log("====================================================\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    // ------------------------------------------------
    // FLOW 1: Login Screen & Sign Up Notice
    // ------------------------------------------------
    console.log("FLOW 1: Navigating to login page...");
    await page.goto(appUrl);
    await page.waitForSelector('text=Welcome back!', { timeout: 15000 });
    
    // Take screenshot of Login page showing "Public registration is disabled" notice
    const loginScreenshotPath = path.join(outputDir, 'login_page.png');
    await page.screenshot({ path: loginScreenshotPath });
    console.log(`✓ Screenshot saved: login_page.png`);

    // ------------------------------------------------
    // LOGIN AS ADMIN (John Doe - Root)
    // ------------------------------------------------
    console.log("Logging in as John Doe (Root)...");
    await page.click('button:has-text("Root")');
    await page.waitForSelector('text=John! 👋', { timeout: 15000 });
    console.log("✓ Logged in as Root.");

    // ------------------------------------------------
    // FLOW 2: Admin Page & Add User Modal
    // ------------------------------------------------
    console.log("FLOW 2: Navigating to Admin tab...");
    await page.locator('div.w-60 button').filter({ hasText: /^Admin$/ }).click();
    await page.waitForSelector('h1:has-text("Admin Panel")', { timeout: 15000 });

    console.log("Switching to Users tab...");
    await page.click('button:has-text("Users")');
    await page.waitForSelector('h3:has-text("Registered Users")', { timeout: 10000 });

    console.log("Opening Add User Modal...");
    await page.click('button:has-text("Add User")');
    await page.waitForSelector('h3:has-text("Add New User")', { timeout: 15000 });

    // Take screenshot of the Add User modal
    const addUserScreenshotPath = path.join(outputDir, 'add_user_modal.png');
    await page.screenshot({ path: addUserScreenshotPath });
    console.log(`✓ Screenshot saved: add_user_modal.png`);

    // Close the modal
    await page.click('h3:has-text("Add New User") >> xpath=.. >> button');
    await page.waitForSelector('h3:has-text("Add New User")', { state: 'detached', timeout: 10000 });

    // ------------------------------------------------
    // FLOW 3: Reports Center with Date Filter
    // ------------------------------------------------
    console.log("FLOW 3: Navigating to Reports tab...");
    await page.click('div.w-60 button:has-text("Reports")');
    await page.waitForSelector('h1:has-text("Reports & Analytics")', { timeout: 15000 });
    await page.waitForSelector('input[type="date"]', { timeout: 10000 });

    // Take screenshot of Reports page with filter date pickers
    const reportsScreenshotPath = path.join(outputDir, 'reports_page.png');
    await page.screenshot({ path: reportsScreenshotPath });
    console.log(`✓ Screenshot saved: reports_page.png`);

    // ------------------------------------------------
    // FLOW 4: Equipment Return Flow
    // ------------------------------------------------
    console.log("FLOW 4: Navigating to Equipment Checkout tab...");
    await page.click('div.w-60 button:has-text("Assets")');
    await page.click('button:has-text("Equipment Checkout")');
    await page.waitForSelector('h1:has-text("Equipment Checkout Control")', { timeout: 15000 });

    const returnBtn = page.locator('button:has-text("Return")');
    const returnBtnCount = await returnBtn.count();
    console.log(`Found ${returnBtnCount} active returnable items.`);

    if (returnBtnCount > 0) {
      // Take screenshot of Equipment Checkout Page log list
      const checkoutScreenshotPath = path.join(outputDir, 'checkout_page.png');
      await page.screenshot({ path: checkoutScreenshotPath });
      console.log(`✓ Screenshot saved: checkout_page.png`);

      console.log("Opening Return Modal for the first item...");
      await returnBtn.first().click();
      await page.waitForSelector('h3:has-text("Return Equipment Item")', { timeout: 15000 });

      // Take screenshot of Return Modal
      const returnModalScreenshotPath = path.join(outputDir, 'return_modal.png');
      await page.screenshot({ path: returnModalScreenshotPath });
      console.log(`✓ Screenshot saved: return_modal.png`);

      // Close the modal
      await page.click('h3:has-text("Return Equipment Item") >> xpath=.. >> button');
      await page.waitForSelector('h3:has-text("Return Equipment Item")', { state: 'detached', timeout: 10000 });
    } else {
      console.log("No items available for return in database to screenshot, skipping flow 4 screenshots.");
    }

    // ------------------------------------------------
    // FLOW 5: Chat Offline Handling in Support Console
    // ------------------------------------------------
    console.log("FLOW 5: Initializing chat session via widget...");
    await page.click('button:has(svg.lucide-message-circle)');
    await page.waitForSelector('h3:has-text("IT Support Chat")', { timeout: 15000 });
    
    const startChatBtn = page.locator('button:has-text("Start Chat")');
    if (await startChatBtn.isVisible()) {
      await startChatBtn.click();
      await page.waitForSelector('text=Welcome John Doe!', { timeout: 15000 });
      console.log("✓ Chat session initialized.");
    }
    
    await page.fill('input[placeholder="Type a message..."]', 'Visual offline testing');
    await page.click('button:has(svg.lucide-send)');
    await page.waitForSelector('p:has-text("Visual offline testing")', { timeout: 15000 });

    await page.click('button:has(svg.lucide-minimize-2)');
    console.log("✓ Chat widget minimized.");

    console.log("Navigating to Chat Admin Console...");
    await page.click('div.w-60 button:has-text("Chat Admin")');
    await page.waitForSelector('h2:has-text("IT Support Console")', { timeout: 15000 });

    console.log("Selecting active John Doe chat...");
    await page.click('button:has-text("John Doe")');
    await page.waitForSelector('h3:has-text("John Doe")', { timeout: 15000 });

    // Claim if necessary
    const claimBtn = page.locator('button:has-text("Claim Sesi"), button:has-text("Claim & Join Chat")');
    if (await claimBtn.first().isVisible()) {
      await claimBtn.first().click();
      await page.waitForSelector('input[placeholder^="Type your reply to"]', { timeout: 15000 });
    }

    console.log("Simulating Offline Mode...");
    await context.setOffline(true);
    await page.waitForSelector('#offline-banner', { timeout: 10000 });
    await page.waitForSelector('input[placeholder="Mode Baca Saja (Offline)"]', { timeout: 10000 });

    // Take screenshot of Offline Chat Console showing banner and disabled input
    const chatOfflineScreenshotPath = path.join(outputDir, 'chat_offline.png');
    await page.screenshot({ path: chatOfflineScreenshotPath });
    console.log(`✓ Screenshot saved: chat_offline.png`);

    // Restore online
    await context.setOffline(false);
    await page.waitForSelector('#offline-banner', { state: 'detached', timeout: 10000 });

    console.log("\n====================================================");
    console.log("🎉 VISUAL TEST SCRIPT EXECUTED SUCCESSFULLY!");
    console.log("====================================================");
    await browser.close();
    return true;

  } catch (error) {
    console.error("Visual test run failed with error:", error);
    try {
      await page.screenshot({ path: path.join(outputDir, 'visual_test_error.png') });
      console.log("Saved error screenshot to visual_test_error.png");
    } catch (e) {
      console.error("Failed to take error screenshot:", e);
    }
    await browser.close();
    return false;
  }
}

runVisualTest().then((success) => {
  process.exit(success ? 0 : 1);
});
