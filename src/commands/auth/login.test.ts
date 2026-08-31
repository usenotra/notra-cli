import { beforeAll, describe, expect, spyOn, test } from 'bun:test';
import { Config } from '@oclif/core';
import AuthLogin from './login';

class TestAuthLogin extends AuthLogin {
  public printEvent(data: unknown): void {
    this.printJson(data);
  }
}

let config: Config;

beforeAll(async () => {
  config = await Config.load(process.cwd());
});

describe('auth login output', () => {
  test('prints each JSON event as one compact NDJSON line', () => {
    const command = new TestAuthLogin([], config);
    const log = spyOn(command, 'log').mockImplementation(() => undefined);

    command.printEvent({ status: 'pending', nested: { value: true } });

    expect(log).toHaveBeenCalledWith('{"status":"pending","nested":{"value":true}}');
  });
});
