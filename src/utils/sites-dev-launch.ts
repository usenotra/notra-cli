import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { SitesDevLaunch } from '../types/sites-dev';

export function sitesDevLaunch(runtime: string, source: string, port: number): SitesDevLaunch {
  const previewArgs = ['notra-sites', 'dev', '--source', source, '--port', String(port)];
  if (process.versions.bun) {
    return {
      command: process.execPath,
      args: ['x', '--bun', '--package', runtime, ...previewArgs],
    };
  }
  const args = ['exec', '--yes', '--package', runtime, '--', ...previewArgs];
  const candidates = [
    ...(process.env.npm_execpath ? [join(dirname(process.env.npm_execpath), 'npm-cli.js')] : []),
    join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  ];
  const npmCli = candidates.find(existsSync);
  if (npmCli) {
    return { command: process.execPath, args: [npmCli, ...args] };
  }
  if (process.platform === 'win32') {
    throw new Error('Unable to locate npm-cli.js. Install Node.js with npm, or run this command with npx.');
  }
  return { command: 'npm', args };
}
