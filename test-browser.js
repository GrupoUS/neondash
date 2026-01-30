import { chromium } from 'playwright';

async function test() {
  console.log('Starting browser test...');
  try {
    const browser = await chromium.launch({ headless: true });
    console.log('Browser launched successfully!');
    const page = await browser.newPage();
    await page.goto('https://www.google.com');
    console.log('Page title:', await page.title());
    await browser.close();
    console.log('Browser closed.');
  } catch (error) {
    console.error('Error launching browser:', error);
    process.exit(1);
  }
}

test();
