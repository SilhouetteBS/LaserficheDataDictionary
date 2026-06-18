import fs from 'node:fs';
import path from 'node:path';

const failures = [];
const config = fs.readFileSync('src/config.js', 'utf8');
const main = fs.readFileSync('src/main.jsx', 'utf8');
const tableWorkspace = fs.readFileSync('src/components/TableWorkspace.jsx', 'utf8');

if (!config.includes("import.meta.env.VITE_ENABLE_EDITING === 'true'")) {
  failures.push('Editing must only enable when VITE_ENABLE_EDITING is exactly true.');
}
if (!tableWorkspace.includes('appConfig.editingEnabled') || !tableWorkspace.includes('lazy(')) {
  failures.push('Manual notes editor must remain behind the editing-enabled lazy import guard.');
}
if (!main.includes('editingWarningAccepted') || !main.includes('canEditNotes')) {
  failures.push('Editing actions must require explicit support-warning acknowledgement.');
}
if (!main.includes('canUseImport = canEditNotes')) {
  failures.push('Import preview must require the same accepted editing warning as notes.');
}
if (!main.includes("...(editingEnabled ? [['import', 'Import']] : [])")) {
  failures.push('Import tab must be hidden unless local editing mode is enabled.');
}
if (!main.includes('EditingCapabilityGuard')) {
  failures.push('Import must render a locked-state guard before editing is acknowledged.');
}
if (!main.includes('Local editing mode only')) {
  failures.push('Editing mode must show a local-only warning banner.');
}

const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  const distFiles = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else {
        distFiles.push(fullPath);
      }
    }
  };
  walk(distDir);
  const forbidden = ['Manual documentation notes', 'Export notes.json', 'Editing enabled'];
  for (const file of distFiles) {
    const content = fs.readFileSync(file, 'utf8');
    forbidden.forEach((text) => {
      if (content.includes(text)) {
        failures.push(`${path.relative(process.cwd(), file)} contains editing-only text: ${text}`);
      }
    });
  }
}

if (failures.length > 0) {
  console.error('Editing guard verification failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Editing guard verification passed.');
