import { afterEach, beforeAll, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { Config } from '@oclif/core';
import type { Notra } from '@usenotra/sdk';
import PostsGet from './get';

const markdown = '# Release notes';

class StubPostsGet extends PostsGet {
  protected override client(): Notra {
    return {
      content: {
        getPost: async () => ({ post: { markdown } }),
      },
    } as unknown as Notra;
  }
}

let config: Config;
let stdoutIsTtyDescriptor: PropertyDescriptor | undefined;

beforeAll(async () => {
  config = await Config.load(process.cwd());
});

beforeEach(() => {
  stdoutIsTtyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
  Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: false });
});

afterEach(() => {
  if (stdoutIsTtyDescriptor) {
    Object.defineProperty(process.stdout, 'isTTY', stdoutIsTtyDescriptor);
  } else {
    delete (process.stdout as { isTTY?: boolean }).isTTY;
  }
});

describe('posts get output mode', () => {
  test('prints explicit Markdown even when JSON output would otherwise apply', async () => {
    const command = new StubPostsGet(['post_abc123', '--markdown'], config);
    const log = spyOn(command, 'log').mockImplementation(() => undefined);

    await command.run();

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(markdown);
  });
});
