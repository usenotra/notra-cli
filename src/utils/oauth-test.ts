import type { Subprocess } from 'bun';

export function createOAuthTestToken(issuer: string, version: number): string {
  const payload = {
    iss: issuer, aud: 'https://api.usenotra.com', sub: 'user_test',
    exp: Math.floor(Date.now() / 1000) + 3600, org_id: 'workos_org',
    'urn:notra:workspace': 'workspace_test', 'urn:notra:access': 'read', version,
  };
  return `test.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
}

export function readOAuthLoginProcess(child: Subprocess<'pipe', 'pipe', 'pipe'>) {
  let resolveUrl!: (url: string) => void;
  let rejectUrl!: (error: Error) => void;
  const authorizationUrl = new Promise<string>((resolve, reject) => {
    resolveUrl = resolve;
    rejectUrl = reject;
  });
  const stdout = (async () => {
    const reader = child.stdout.getReader();
    const decoder = new TextDecoder();
    let output = '';
    let buffered = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        output += chunk;
        buffered += chunk;
        let end: number;
        while ((end = buffered.indexOf('\n')) !== -1) {
          const line = buffered.slice(0, end);
          buffered = buffered.slice(end + 1);
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.status === 'pending') resolveUrl(event.authorizationUrl);
        }
      }
      return output;
    } finally { reader.releaseLock(); }
  })();
  const result = Promise.all([stdout, new Response(child.stderr).text(), child.exited])
    .then(([stdout, stderr, code]) => {
      rejectUrl(new Error(stdout + stderr || 'Login exited without an authorization URL.'));
      return { stdout, stderr, code };
    });
  return { authorizationUrl, result };
}
