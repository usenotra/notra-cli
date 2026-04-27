import { spawn } from 'node:child_process';

export function openInBrowser(url: string): boolean {
  const cmd =
    process.platform === 'darwin'
      ? { name: 'open', args: [url] }
      : process.platform === 'win32'
        ? { name: 'cmd', args: ['/c', 'start', '""', url] }
        : { name: 'xdg-open', args: [url] };
  try {
    const child = spawn(cmd.name, cmd.args, { stdio: 'ignore', detached: true });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
