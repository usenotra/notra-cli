import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Errors } from '../cli/core';

export async function resolveSiteSource(source: string): Promise<string> {
  const root = resolve(source);
  const directory = await stat(root).catch(() => null);
  if (!directory?.isDirectory()) {
    throw new Errors.CLIError(`Site folder does not exist: ${root}`, { exit: 2 });
  }
  const markers = await Promise.all(
    ['blog.json', 'blog', 'changelog'].map((name) => stat(resolve(root, name)).catch(() => null)),
  );
  if (!(markers[0]?.isFile() || markers[1]?.isDirectory() || markers[2]?.isDirectory())) {
    throw new Errors.CLIError(
      `No Notra site found in ${root}. Run this from a folder containing blog.json, blog/, or changelog/, use --source <folder>, or run notra dev --init to create a starter site.`,
      { exit: 2 },
    );
  }
  return root;
}
