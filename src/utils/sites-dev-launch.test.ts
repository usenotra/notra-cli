import { expect, test } from 'bun:test';
import { sitesDevLaunch } from './sites-dev-launch';

test('Bun launches the pinned renderer with Bun and preserves argument boundaries', () => {
  expect(sitesDevLaunch('@usenotra/sites-dev@0.1.0', '/tmp/site with spaces ü', 4400)).toEqual({
    command: process.execPath,
    args: ['x', '--bun', '--package', '@usenotra/sites-dev@0.1.0', 'notra-sites', 'dev', '--source', '/tmp/site with spaces ü', '--port', '4400'],
  });
});
