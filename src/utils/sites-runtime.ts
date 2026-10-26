import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Errors } from '../cli/core';

// The Sites renderer ships in the package's sites/ folder, exported from the
// Notra monorepo. NOTRA_SITES_RUNTIME points at an unreleased build instead.
export function sitesRuntimePath(): string {
  if (process.env.NOTRA_SITES_RUNTIME) return resolve(process.env.NOTRA_SITES_RUNTIME);
  let directory = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(directory, 'package.json'))) {
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  const runtime = join(directory, 'sites', 'dist', 'cli.mjs');
  if (!existsSync(runtime)) {
    throw new Errors.CLIError('The Notra Sites renderer is missing from this installation. Reinstall notra.', { exit: 1 });
  }
  return runtime;
}
