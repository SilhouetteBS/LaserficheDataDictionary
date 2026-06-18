import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const requiredCspParts = [
  'Content-Security-Policy',
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
];
const missing = requiredCspParts.filter((part) => !html.includes(part));

if (missing.length > 0) {
  console.error(`Static security metadata missing: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Static security metadata verified.');
