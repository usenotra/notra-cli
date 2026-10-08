import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export async function writeTextFileAtomically(filePath: URL, contents: string): Promise<void> {
  const temporary = new URL(filePath);
  temporary.pathname += `.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, contents, { flag: 'wx' });
    await rename(temporary, filePath);
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function readTextFromFileOrStdin(
  filePath: string | undefined,
  stdinError: string,
): Promise<string> {
  if (filePath && filePath !== '-') {
    return readFile(filePath, 'utf8');
  }
  if (process.stdin.isTTY) {
    throw new Error(stdinError);
  }
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

export async function readJsonFromFileOrStdin(
  filePath: string,
  stdinError: string,
): Promise<unknown> {
  const raw = await readTextFromFileOrStdin(filePath, stdinError);
  return JSON.parse(raw);
}
