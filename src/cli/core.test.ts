import { describe, expect, expectTypeOf, test } from 'bun:test';
import { Args, Command, Errors, Flags, parseArgv } from './core';

class TypedCommand extends Command {
  static override args = {
    id: Args.string({ required: true }),
    format: Args.string({ options: ['json', 'markdown'] as const }),
  };

  static override flags = {
    limit: Flags.integer({ default: 10 }),
    tag: Flags.string({ multiple: true, default: [] }),
    force: Flags.boolean({}),
  };

  public values() {
    return this.parse(TypedCommand);
  }

  public async run(): Promise<void> {}
}

describe('parseArgv', () => {
  test('parses positional arguments and typed flags', () => {
    const result = parseArgv(
      ['project_1', '--limit', '20', '--tag=a,b', '--tag', 'c', '--no-enabled'],
      { projectId: Args.string({ required: true }) },
      {
        limit: Flags.integer({ min: 1, max: 100 }),
        tag: Flags.string({ multiple: true, delimiter: ',' }),
        enabled: Flags.boolean({ allowNo: true, default: true }),
      },
    );

    expect(result.args).toEqual({ projectId: 'project_1' });
    expect(result.flags).toEqual({ limit: 20, tag: ['a', 'b', 'c'], enabled: false });
  });

  test('rejects missing required values and invalid options', () => {
    expect(() =>
      parseArgv([], { projectId: Args.string({ required: true }) }, {}),
    ).toThrow(Errors.CLIError);
    expect(() =>
      parseArgv(['--sort', 'sideways'], {}, {
        sort: Flags.string({ options: ['asc', 'desc'] }),
      }),
    ).toThrow('Expected one of: asc, desc');
  });

  test('enforces mutually exclusive flags', () => {
    expect(() =>
      parseArgv(['--file', 'input.json', '--name', 'test'], {}, {
        file: Flags.string({ exclusive: ['name'] }),
        name: Flags.string(),
      }),
    ).toThrow('--file cannot be used with --name');
  });

  test('infers command argument and flag types', async () => {
    const result = await new TypedCommand(['item_1', 'markdown', '--tag', 'news']).values();
    expectTypeOf(result.args.id).toEqualTypeOf<string>();
    expectTypeOf(result.args.format).toEqualTypeOf<'json' | 'markdown' | undefined>();
    expectTypeOf(result.flags.limit).toEqualTypeOf<number>();
    expectTypeOf(result.flags.tag).toEqualTypeOf<string[]>();
    expectTypeOf(result.flags.force).toEqualTypeOf<boolean | undefined>();
    expect(result.args).toEqual({ id: 'item_1', format: 'markdown' });
    expect(result.flags.limit).toBe(10);
    expect(result.flags.tag).toEqual(['news']);
    expect('force' in result.flags).toBe(false);
  });
});
