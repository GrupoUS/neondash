import { chromium } from 'playwright';

async function test() {
  console.log('Starting browser test...');
  try {
    let browser;
    try {
      console.log('Trying default Chromium launch...');
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch (e) {
      console.log('Default launch failed, trying system Chrome fallback...');
      browser = await chromium.launch({ 
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: true 
      });
    }
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
