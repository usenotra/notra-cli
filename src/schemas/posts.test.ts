import { describe, expect, test } from 'bun:test';
import { validateCreatePostGenerationRequest } from './posts';

describe('post generation source selectors', () => {
  test('accepts one GitHub and one Linear selector together', () => {
    const request = {
      contentType: 'changelog',
      github: { repositories: [{ owner: 'acme', repo: 'app' }] },
      integrations: { linear: ['linear_1'] },
    };
    expect(validateCreatePostGenerationRequest(request)).toEqual(request);
  });

  test('rejects competing GitHub source selectors', () => {
    for (const selectors of [
      { repositoryIds: ['repo_1'], integrations: { github: ['repo_2'] } },
      { repositoryIds: ['repo_1'], github: { repositories: [{ owner: 'acme', repo: 'app' }] } },
      { integrations: { github: ['repo_1'] }, github: { repositories: [{ owner: 'acme', repo: 'app' }] } },
    ]) {
      expect(() => validateCreatePostGenerationRequest({ contentType: 'changelog', ...selectors }))
        .toThrow('Provide only one GitHub source selector');
    }
  });

  test('rejects competing Linear source selectors', () => {
    expect(() => validateCreatePostGenerationRequest({
      contentType: 'changelog',
      linearIntegrationIds: ['linear_1'],
      integrations: { linear: ['linear_2'] },
    })).toThrow('Provide only one Linear source selector');
  });
});
