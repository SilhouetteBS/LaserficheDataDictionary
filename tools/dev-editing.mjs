import { spawn } from 'node:child_process';
import { join } from 'node:path';

const viteBin = join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vite.cmd' : 'vite',
);

const child = spawn(viteBin, ['--host', '127.0.0.1', ...process.argv.slice(2)], {
  env: {
    ...process.env,
    VITE_ENABLE_EDITING: 'true',
  },
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
