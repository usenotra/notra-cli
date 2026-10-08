import { createServer } from 'node:net';

export async function startInterruptedStreamServer(statusCode = 200) {
  const server = createServer((socket) => {
    socket.once('data', () => {
      const event = '{"type":"pending"}\n';
      socket.write(
        `HTTP/1.1 ${statusCode} Mock\r\nContent-Type: application/x-ndjson\r\n` +
        'Transfer-Encoding: chunked\r\nConnection: close\r\n\r\n' +
        `${Buffer.byteLength(event).toString(16)}\r\n${event}\r\n`,
      );
      // Close without the final chunk after the client has received an event.
      setTimeout(() => socket.destroy(), 100);
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP listener.');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}
