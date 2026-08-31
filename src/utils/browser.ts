import { spawn } from 'node:child_process';

export function openInBrowser(url: string): Promise<boolean> {
  const cmd =
    process.platform === 'darwin'
      ? { name: 'open', args: [url] }
      : process.platform === 'win32'
        ? { name: 'cmd', args: ['/c', 'start', '""', url] }
        : { name: 'xdg-open', args: [url] };
  return new Promise((resolve) => {
    try {
      const child = spawn(cmd.name, cmd.args, { stdio: 'ignore', detached: true });
      child.once('spawn', () => resolve(true));
      child.once('error', () => resolve(false));
      child.unref();
    } catch {
      resolve(false);
    }
  });
}
