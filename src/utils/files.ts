import { readFile } from 'node:fs/promises';

export async function readMarkdownFromFileOrStdin(filePath?: string): Promise<string> {
  if (filePath && filePath !== '-') {
    return readFile(filePath, 'utf8');
  }
  return readStdin();
}

export async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    throw new Error('Expected markdown via --markdown-file or piped on stdin.');
  }
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
}
