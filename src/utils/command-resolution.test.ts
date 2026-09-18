import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { resolveCommand } from './command-resolution';

const commandsRoot = join(import.meta.dir, '..', 'commands');

describe('command resolution', () => {
  test('resolves commands below the command root', () => {
    expect(resolveCommand(['posts', 'list'], commandsRoot, '.ts')).toMatchObject({
      name: 'posts list',
      commandIndices: [0, 1],
    });
  });

  test('rejects traversal and slash-containing command segments', () => {
    expect(resolveCommand(['..', 'run'], commandsRoot, '.ts')).toBeUndefined();
    expect(resolveCommand(['../run'], commandsRoot, '.ts')).toBeUndefined();
    expect(resolveCommand(['posts/list'], commandsRoot, '.ts')).toBeUndefined();
  });

  test('ignores global flags between command segments', () => {
    expect(resolveCommand(['geo', '--json', 'projects', 'list'], commandsRoot, '.ts'))
      .toMatchObject({ name: 'geo projects list', commandIndices: [0, 2, 3] });
    expect(resolveCommand(['--api-key', 'secret', 'posts', 'list'], commandsRoot, '.ts'))
      .toMatchObject({ name: 'posts list', commandIndices: [2, 3] });
  });
});
