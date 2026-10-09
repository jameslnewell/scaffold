import {addTeamToRepo, addUserToRepo, createRepo} from './github.js';
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import type {TaskContext} from '@buildscaffold/task';

const ctx: TaskContext = {directory: process.cwd(), diff: new Map()};
const token = 'secret-token';

describe('github', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_TOKEN', token);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test.each([
    {
      task: createRepo('acme/foo'),
      label: 'create GitHub repo acme/foo',
      params: {repo: 'acme/foo'},
    },
    {
      task: addUserToRepo({repo: 'acme/foo', user: 'bob', permission: 'push'}),
      label: 'give bob push access to GitHub repo acme/foo',
      params: {repo: 'acme/foo', user: 'bob', permission: 'push'},
    },
    {
      task: addTeamToRepo({
        repo: 'acme/foo',
        team: 'acme/devs',
        permission: 'maintain',
      }),
      label: 'give team acme/devs maintain access to GitHub repo acme/foo',
      params: {repo: 'acme/foo', team: 'acme/devs', permission: 'maintain'},
    },
  ])(
    '$label has params and a label without the token',
    ({task, label, params}) => {
      expect(task).toMatchObject({type: 'function', label, params});
      expect(JSON.stringify(task)).not.toContain(token);
    },
  );

  test('createRepo throws when the name is not "owner/name"', async () => {
    await expect(createRepo('my-package').run(ctx)).rejects.toThrow(
      'Expected a name like "owner/name" but received "my-package"',
    );
  });

  test('createRepo throws when there is no GITHUB_TOKEN', async () => {
    vi.stubEnv('GITHUB_TOKEN', '');
    await expect(createRepo('owner/name').run(ctx)).rejects.toThrow(
      'GITHUB_TOKEN',
    );
  });
});
