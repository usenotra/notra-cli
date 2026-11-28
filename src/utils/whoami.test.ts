import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { renderWhoAmI } from './whoami';

const workspace = (slug: string, status = 'active', isCurrent = false) => ({
  id: `org_${slug}`,
  slug,
  name: slug[0]!.toUpperCase() + slug.slice(1),
  logo: null,
  role: 'admin',
  status,
  isCurrent,
});

let noColor: string | undefined;
beforeEach(() => {
  noColor = process.env.NO_COLOR;
  process.env.NO_COLOR = '1';
});
afterEach(() => {
  if (noColor === undefined) delete process.env.NO_COLOR;
  else process.env.NO_COLOR = noColor;
});

describe('renderWhoAmI', () => {
  test('prints the context as JSON when a workspace is selected', () => {
    const result = {
      currentWorkspace: workspace('acme'),
      selectionRequired: false,
      workspaces: [workspace('acme', 'active', true), workspace('beta')],
      authentication: { type: 'apiKey' },
    };
    expect(renderWhoAmI(result)).toBe(JSON.stringify(result, null, 2));
  });

  test('keeps working against an API that does not send selectionRequired', () => {
    const result = { currentWorkspace: workspace('acme'), workspaces: [workspace('acme', 'active', true)] };
    expect(renderWhoAmI(result)).toBe(JSON.stringify(result, null, 2));
  });

  test('adds a hint naming the selectable workspaces while none is selected', () => {
    const result = {
      currentWorkspace: workspace('acme'),
      selectionRequired: true,
      workspaces: [workspace('acme'), workspace('beta'), workspace('gamma', 'pending')],
      authentication: { type: 'apiKey' },
    };
    const [json, hint] = renderWhoAmI(result).split('\n}\n');
    expect(JSON.parse(`${json}\n}`)).toEqual(result);
    expect(hint).toBe(
      'No workspace is selected, so other commands will fail. This key can act in: Acme (acme), Beta (beta). ' +
        'Run `notra workspaces list` to see your workspaces, then `notra workspaces use <id|slug>`, ' +
        'or pass --org <id|slug> / set NOTRA_ORGANIZATION_ID.',
    );
  });
});
