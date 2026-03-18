const { chromium } = require('@playwright/test');
const readline = require('readline');

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc8RRUAG8n8nPB9dm21m_MxwHQ-JuDnEj7GnvwEkWXykkKFuQ/viewform';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(FORM_URL);

  console.log('👉 Please login to your Google account if asked.');
  console.log('👉 WAIT until you see the Form page ("Simulated Work Daily Journal Form").');
  console.log('👉 THEN press ENTER here in the console to save auth.');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise(resolve => {
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });

  await context.storageState({ path: 'auth.json' });
  console.log('✅ auth.json saved AFTER full login');

  await browser.close();
})();
