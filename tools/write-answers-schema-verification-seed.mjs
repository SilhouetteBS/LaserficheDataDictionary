import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const outDir = path.join(root, '.tmp', 'answers-sql-research');
const outputPath = path.join(outDir, 'candidates.json');

const products = ['forms', 'lfds', 'repository', 'workflow'];
const candidates = Object.fromEntries(products.map((product) => [product, []]));
const seen = new Set();

function parseProcessedRow(line, sourceFile) {
  const match = line.match(
    /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*\|\s*([^|]+?)\s*\|\s*\[Answers\]\((https:\/\/answers\.laserfiche\.com\/questions\/[^)]+)\)\s*\|$/,
  );
  if (!match) return null;
  const [, product, status, risk, title, disposition, url] = match;
  return {
    sourceFile,
    product: product.trim().toLowerCase(),
    status: status.trim(),
    risk: risk.trim(),
    title: title.trim(),
    disposition: disposition.trim(),
    url: url.trim().replace(/#.*$/, '').replace(/\/$/, ''),
  };
}

const processedDocs = fs
  .readdirSync(docsDir)
  .filter((file) => /^answers-sql-processed(?:-|_).+\.md$/i.test(file))
  .filter((file) => !file.includes('exclusions'))
  .sort();

for (const sourceFile of processedDocs) {
  const content = fs.readFileSync(path.join(docsDir, sourceFile), 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line.includes('| Needs schema verification |')) continue;
    const row = parseProcessedRow(line, sourceFile);
    if (!row || !products.includes(row.product) || seen.has(row.url)) continue;
    seen.add(row.url);
    candidates[row.product].push({
      product: row.product,
      title: row.title,
      url: row.url,
      foundBy: [`schema verification seed from ${row.sourceFile}`],
    });
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(candidates, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      output: path.relative(root, outputPath),
      rawRows: [...Object.values(candidates)].reduce((sum, rows) => sum + rows.length, 0),
      byProduct: Object.fromEntries(Object.entries(candidates).map(([product, rows]) => [product, rows.length])),
    },
    null,
    2,
  ),
);
