import type { Subprocess } from 'bun';

export async function readCliProcess(child: Subprocess<'pipe', 'pipe', 'pipe'>) {
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  return { stdout, stderr, code };
}
