import { MAX_NDJSON_EVENT_BYTES, NDJSON_INITIAL_BUFFER_BYTES } from '../constants/http';
import { ApiResponseDecodeError } from './parse-api-response';

export class NdjsonParser {
  private buffer = new Uint8Array(NDJSON_INITIAL_BUFFER_BYTES);
  private length = 0;
  private readonly decoder = new TextDecoder('utf-8', { fatal: true });

  *push(chunk: Uint8Array): Generator<unknown> {
    let offset = 0;
    while (offset < chunk.length) {
      const newline = chunk.indexOf(10, offset);
      const end = newline === -1 ? chunk.length : newline;
      this.append(chunk.subarray(offset, end));
      if (newline === -1) return;
      const event = this.parseLine();
      if (event !== undefined) yield event;
      offset = newline + 1;
    }
  }

  finish(): unknown {
    return this.parseLine();
  }

  private append(bytes: Uint8Array): void {
    const required = this.length + bytes.length;
    if (required > MAX_NDJSON_EVENT_BYTES) {
      throw new ApiResponseDecodeError('NDJSON event', [`Event exceeds the ${MAX_NDJSON_EVENT_BYTES} byte limit.`]);
    }
    if (required > this.buffer.length) {
      const buffer = new Uint8Array(Math.min(MAX_NDJSON_EVENT_BYTES, Math.max(required, this.buffer.length * 2)));
      buffer.set(this.buffer.subarray(0, this.length));
      this.buffer = buffer;
    }
    this.buffer.set(bytes, this.length);
    this.length = required;
  }

  private parseLine(): unknown {
    const length = this.length;
    this.length = 0;
    try {
      const line = this.decoder.decode(this.buffer.subarray(0, length)).trim();
      return line ? JSON.parse(line) : undefined;
    } catch {
      throw new ApiResponseDecodeError('NDJSON event', ['Malformed JSON or UTF-8 in the event stream.']);
    }
  }
}
