const { chromium } = require('@playwright/test');
const fs = require('fs');

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc8RRUAG8n8nPB9dm21m_MxwHQ-JuDnEj7GnvwEkWXykkKFuQ/viewform';

(async () => {
  const browser = await chromium.launch({ headless: true });

  let storageState;
  if (process.env.AUTH_STATE) {
    storageState = JSON.parse(process.env.AUTH_STATE);
  } else if (fs.existsSync('auth.json')) {
    const authContent = fs.readFileSync('auth.json', 'utf-8');
    if (authContent.trim() !== '' && authContent.trim() !== '{}') {
      storageState = 'auth.json';
    }
  }

  const contextOptions = storageState ? { storageState } : {};
  const context = await browser.newContext(contextOptions);

  const page = await context.newPage();

  console.log('Navigating to form...');
  await page.goto(FORM_URL, { waitUntil: 'networkidle' });

  if (page.url().includes('accounts.google.com')) {
    console.error('Redirected to Google Login. Please run `node login.js` first to save your session.');
    await browser.close();
    return;
  }

  console.log('Filling Page 1...');

  // 1. Checkbox "Record email"
  const checkbox = page.getByRole('checkbox');
  if (await checkbox.count() > 0) {
    const isChecked = await checkbox.first().getAttribute('aria-checked');
    if (isChecked === 'false' || !isChecked) {
      await checkbox.first().click();
    }
  }

  // 2. Radio button: "It was a working day, and I was present"
  await page.getByRole('radio', { name: 'It was a working day, and I was present' }).click();

  // 3. Next button
  await page.getByRole('button', { name: 'Next' }).click();

  console.log('Waiting for Page 2...');

  // Wait for the next page to load
  await page.waitForLoadState('networkidle');
  await page.getByText('What were your key tasks for the day?').waitFor({ state: 'visible', timeout: 15000 });

  console.log('Filling Page 2...');

  // 4. Fill textboxes
  const textboxes = page.getByRole('textbox');

  await textboxes.nth(0).fill('Work on SW project and raised PR');
  await textboxes.nth(1).fill('N/A');
  await textboxes.nth(2).fill('N/A');
  await textboxes.nth(3).fill('Work on next task for Simulated work');

  console.log('Clicking Next on Page 2...');
  // 5. Next button on Page 2
  await page.getByRole('button', { name: 'Next' }).click();

  console.log('Waiting for Page 3...');
  // 6. Wait for Page 3
  await page.waitForLoadState('networkidle');
  await page.getByText("Thank you for filling today's journal").waitFor({ state: 'visible', timeout: 15000 });

  console.log('Submitting form...');
  // 7. Submit button on Page 3
  await page.getByRole('button', { name: 'Submit' }).click();

  console.log('Waiting for confirmation...');
  // 8. Confirmation (default Google Forms message)
  // Usually includes "Your response has been recorded" or similar.
  // We'll just wait for the URL to contain formResponse securely
  await page.waitForURL(/\/formResponse/, { timeout: 15000 }).catch(() => {
    console.log('Could not verify URL change, but continuing...');
  });
  await page.waitForTimeout(2000); // Give it a moment

  console.log('✅ Form submitted successfully!');
  await browser.close();
})();
