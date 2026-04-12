const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const urls = [
    { url: 'http://localhost:8105/', path: 'docs/dashboard.png' },
    { url: 'http://localhost:8105/inventory', path: 'docs/inventory.png' },
    { url: 'http://localhost:8105/explorer', path: 'docs/data_explorer.png' },
    { url: 'http://localhost:8105/summary', path: 'docs/run_summary.png' }
  ];

  for (const item of urls) {
    console.log(`Navigating to ${item.url}...`);
    // Wait until network is idle
    await page.goto(item.url, { waitUntil: 'networkidle' });
    
    // Explicitly wait an extra 2 seconds for any JS animations (like loaders fading out or charts rendering) to finish
    await page.waitForTimeout(4000); 

    console.log(`Taking screenshot for ${item.path}...`);
    await page.screenshot({ path: path.join(__dirname, item.path), fullPage: true });
  }

  await browser.close();
  console.log('Screenshots complete!');
})();


