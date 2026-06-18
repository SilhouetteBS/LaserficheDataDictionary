import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const outputPath = process.argv[2] ?? join(process.cwd(), 'outputs', 'release-notes-draft.md');

function getRecentCommits() {
  try {
    return execFileSync('git', ['log', '--oneline', '--max-count=20'], { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

const recentCommits = getRecentCommits();
const generatedAt = new Date().toISOString();
const markdown = [
  '# Release Notes Draft',
  '',
  `Generated: ${generatedAt}`,
  '',
  '## Release Highlights',
  '',
  '- Summarize the user-facing changes for this release.',
  '- Note any new or updated product/version schema metadata.',
  '- Include validation or deployment notes that matter to users.',
  '',
  '## Recent Git History',
  '',
  ...(recentCommits.length > 0
    ? recentCommits.map((commit) => `- ${commit}`)
    : ['- Git history was not available.']),
  '',
  '## Review Checklist',
  '',
  '- Confirm public read-only builds do not expose local editing tools.',
  '- Confirm schema export/import documentation still warns against database writes.',
  '- Run validation before publishing.',
  '',
].join('\n');

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, markdown);
console.log(outputPath);
