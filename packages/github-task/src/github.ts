import {Octokit} from '@octokit/rest';
import type {Task} from '@buildscaffold/task';

export type Permission = 'pull' | 'triage' | 'push' | 'maintain' | 'admin';

function split(name: string): [string, string] {
  const [owner, rest, ...extra] = name.split('/');
  if (!owner || !rest || extra.length > 0) {
    throw new Error(`Expected a name like "owner/name" but received "${name}"`);
  }
  return [owner, rest];
}

function getClient(): Octokit {
  const token = process.env['GITHUB_TOKEN'];
  if (!token) {
    throw new Error(
      'An environment variable named "GITHUB_TOKEN" is required to make changes on GitHub',
    );
  }
  return new Octokit({auth: token});
}

/**
 * A task which creates a repository for a user or organisation, unless it already exists.
 *
 * Requires a `GITHUB_TOKEN` environment variable.
 *
 * @example
 * createRepo('jameslnewell/my-package')
 */
export function createRepo(repo: string): Task {
  return async () => {
    const [owner, name] = split(repo);
    const octokit = getClient();

    // octokit throws rather than resolving with a 404 status when the repository doesn't exist
    try {
      await octokit.rest.repos.get({owner, repo: name});
      return;
    } catch (error) {
      const isNotFound =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        error.status === 404;
      if (!isNotFound) throw error;
    }

    const user = await octokit.rest.users.getAuthenticated();
    // logins are case insensitive
    if (user.data.login.toLowerCase() === owner.toLowerCase()) {
      await octokit.rest.repos.createForAuthenticatedUser({name});
    } else {
      await octokit.rest.repos.createInOrg({org: owner, name});
    }
  };
}

export interface AddUserToRepoOptions {
  /** The repository e.g. `owner/name` */
  repo: string;
  /** The user's login */
  user: string;
  permission: Permission;
}

/**
 * A task which adds a collaborator to a repository.
 *
 * Requires a `GITHUB_TOKEN` environment variable.
 *
 * @example
 * addUserToRepo({repo: 'jameslnewell/my-package', user: 'octocat', permission: 'push'})
 */
export function addUserToRepo({
  repo,
  user,
  permission,
}: AddUserToRepoOptions): Task {
  return async () => {
    const [owner, name] = split(repo);
    await getClient().rest.repos.addCollaborator({
      owner,
      repo: name,
      username: user,
      permission,
    });
  };
}

export interface AddTeamToRepoOptions {
  /** The repository e.g. `owner/name` */
  repo: string;
  /** The team e.g. `org/team-slug` */
  team: string;
  permission: Permission;
}

/**
 * A task which gives a team access to a repository.
 *
 * Requires a `GITHUB_TOKEN` environment variable.
 *
 * @example
 * addTeamToRepo({repo: 'my-org/my-package', team: 'my-org/maintainers', permission: 'maintain'})
 */
export function addTeamToRepo({
  repo,
  team,
  permission,
}: AddTeamToRepoOptions): Task {
  return async () => {
    const [owner, name] = split(repo);
    const [org, slug] = split(team);
    await getClient().rest.teams.addOrUpdateRepoPermissionsInOrg({
      owner,
      repo: name,
      org,
      team_slug: slug,
      permission,
    });
  };
}
