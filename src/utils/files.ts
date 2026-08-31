import { readFile } from 'node:fs/promises';

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
