import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:4177';
const executablePath = process.env.CHROME_PATH || undefined;

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleMessages = [];
page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) {
    consoleMessages.push(`${message.type()}: ${message.text()}`);
  }
});

await page.goto(appUrl, { waitUntil: 'networkidle' });
assert.equal(await page.title(), 'Laserfiche Database Dictionary');
assert.equal(await page.locator('h1').first().textContent(), 'Laserfiche Database Dictionary');

await page.getByRole('button', { name: 'Health', exact: true }).click();
await page.waitForTimeout(100);
assert.equal(await page.locator('.detail-surface h2').textContent(), 'Schema health');
assert.ok((await page.locator('.health-row').count()) > 0);

await page.getByRole('button', { name: 'Reporting', exact: true }).click();
await page.waitForTimeout(100);
assert.equal(await page.locator('.detail-surface h2').textContent(), 'Reporting guide');
assert.equal(await page.locator('.query-example').count(), 4);

await page.getByRole('button', { name: 'Tables', exact: true }).click();
await page.getByRole('button', { name: 'dbo.cf_users Unknown', exact: true }).click();
await page.waitForTimeout(100);
assert.equal(await page.getByRole('heading', { name: 'Manual documentation notes' }).count(), 0);
assert.equal(await page.getByText('Import notes', { exact: true }).count(), 0);
assert.match(page.url(), /table=dbo\.cf_users/);
await page.reload({ waitUntil: 'networkidle' });
assert.equal(await page.locator('.table-detail h2').textContent(), 'dbo.cf_users');
assert.deepEqual(consoleMessages, []);

await browser.close();
console.log(
  JSON.stringify(
    {
      appUrl,
      consoleMessages,
      restoredTable: 'dbo.cf_users',
    },
    null,
    2,
  ),
);
