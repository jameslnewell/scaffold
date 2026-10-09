# @buildscaffold/github-task

[Tasks](../task) for creating and configuring GitHub repositories after a scaffold's changes have been applied.

```console
npm install @buildscaffold/core @buildscaffold/task @buildscaffold/github-task
```

## Usage

The tasks require a `GITHUB_TOKEN` environment variable.

```ts
import {addTeamToRepo, createRepo} from '@buildscaffold/github-task';
import {serial} from '@buildscaffold/task';

const tasks = serial([
  createRepo('my-org/my-package'),
  addTeamToRepo({
    repo: 'my-org/my-package',
    team: 'my-org/maintainers',
    permission: 'maintain',
  }),
]);
```

- `createRepo(repo)` - create a repository for a user or organisation, e.g. `owner/name`, unless it already exists
- `addUserToRepo({repo, user, permission})` - add a collaborator to a repository
- `addTeamToRepo({repo, team, permission})` - give a team, e.g. `org/team-slug`, access to a repository

`permission` is one of `pull`, `triage`, `push`, `maintain` or `admin`.

Each task is a [function task](../task#usage) whose `params` hold its arguments and whose label names them, e.g. `create GitHub repo my-org/my-package`. Neither contains the token.
