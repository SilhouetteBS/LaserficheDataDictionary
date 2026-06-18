import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const rootPackage = lock.packages?.[''];
const failures = [];

if (!rootPackage) {
  failures.push('package-lock.json is missing the root package entry.');
} else {
  for (const section of ['dependencies', 'devDependencies']) {
    const packageDeps = pkg[section] ?? {};
    const lockDeps = rootPackage[section] ?? {};
    for (const [name, version] of Object.entries(packageDeps)) {
      if (lockDeps[name] !== version) {
        failures.push(`${section}.${name} mismatch: package.json=${version}, package-lock.json=${lockDeps[name] ?? '(missing)'}`);
      }
    }
    for (const name of Object.keys(lockDeps)) {
      if (!(name in packageDeps)) {
        failures.push(`${section}.${name} exists in package-lock.json but not package.json.`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Lockfile integrity check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Lockfile integrity check passed.');
