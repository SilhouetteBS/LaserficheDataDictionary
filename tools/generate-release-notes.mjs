import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const backlogPath = join(process.cwd(), 'docs', 'backlog.md');
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

function getCompletedBacklogItems() {
  if (!existsSync(backlogPath)) {
    return [];
  }

  return readFileSync(backlogPath, 'utf8')
    .split('\n')
    .map((line) => line.match(/^\d+\.\s+\[x\]\s+(.+)$/i)?.[1])
    .filter(Boolean)
    .slice(-30);
}

const completedItems = getCompletedBacklogItems();
const recentCommits = getRecentCommits();
const generatedAt = new Date().toISOString();
const markdown = [
  '# Release Notes Draft',
  '',
  `Generated: ${generatedAt}`,
  '',
  '## Completed Backlog Highlights',
  '',
  ...(completedItems.length > 0
    ? completedItems.map((item) => `- ${item}`)
    : ['- No completed backlog items were found.']),
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
