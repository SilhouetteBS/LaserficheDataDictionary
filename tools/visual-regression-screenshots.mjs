import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:4177';
const outputDir = process.env.VISUAL_SCREENSHOT_DIR ?? 'artifacts/visual-regression';
const executablePath = process.env.CHROME_PATH || undefined;

fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleMessages = [];
const allowedConsolePatterns = [
  /Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element\./,
];

page.on('console', (message) => {
  if (!['error', 'warning'].includes(message.type())) {
    return;
  }

  if (allowedConsolePatterns.some((pattern) => pattern.test(message.text()))) {
    return;
  }

  consoleMessages.push(`${message.type()}: ${message.text()}`);
});

function diagramUrl(params) {
  const url = new URL(appUrl);
  url.search = new URLSearchParams(params).toString();
  return url.toString();
}

async function capture(name, params, beforeCapture) {
  await page.goto(diagramUrl(params), { waitUntil: 'networkidle' });
  await page.locator('.database-diagram').waitFor({ state: 'visible', timeout: 10000 });
  if (beforeCapture) {
    await beforeCapture();
  }
  const filePath = path.join(outputDir, `${name}.png`);
  await page.locator('.detail-surface').screenshot({ path: filePath });
  const fileSize = fs.statSync(filePath).size;
  assert.ok(fileSize > 10_000, `${name} screenshot should not be blank`);
  return { filePath, fileSize };
}

const screenshots = [];

screenshots.push(await capture('focused-fk-mode', {
  product: 'lfds',
  version: '12.0.2506.370',
  view: 'diagram',
  diagramFocus: 'dbo.adgs_rules',
  diagramMode: 'focused',
  diagramEdges: 'foreignKey',
  diagramDepth: '2',
  diagramZoom: '1',
  diagramSecondHop: 'hidden',
}));

screenshots.push(await capture('dependency-mode', {
  product: 'lfds',
  version: '12.0.2506.370',
  view: 'diagram',
  diagramFocus: 'dbo.adgs_rules',
  diagramMode: 'focused',
  diagramEdges: 'dependency',
  diagramDepth: '1',
  diagramZoom: '1',
}));

screenshots.push(await capture('selected-relationship-hover', {
  product: 'lfds',
  version: '12.0.2506.370',
  view: 'diagram',
  diagramFocus: 'dbo.adgs_rules',
  diagramMode: 'focused',
  diagramEdges: 'foreignKey',
  diagramDepth: '1',
  diagramZoom: '1',
}, async () => {
  await page.locator('.diagram-edge-hit-target').first().hover();
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.diagram-lines path.diagram-edge-selected').count(), 1);
}));

assert.deepEqual(consoleMessages, []);

await browser.close();
console.log(JSON.stringify({ appUrl, outputDir, screenshots }, null, 2));
