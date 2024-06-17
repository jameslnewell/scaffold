import {Octokit} from '@octokit/rest'

type Permission = 'pull' | 'triage' | 'push' | 'maintain' | 'admin'

function split(name: string): [string, string] {
  const [owner, repository] = name.split('/')
  return [
    owner,
    repository
  ]
}

let client: Octokit | undefined

function createClient(): Octokit {
  if (client) return client

  const token = process.env['GITHUB_TOKEN'];
  if (!token) throw new Error('An environment variable named "GITHUB_TOKEN" is required in order to perform Github operations.')

  return new Octokit({
    auth: token
  })
}

// TODO: option to error if already exists
interface CreateRepoOptions {
}

/**
 * @param repo The repository e.g. jameslnewell/repository
 */
export function createRepo(repo: string, options: CreateRepoOptions = {}) {
  return async () => {
    const [owner, repository] = split(repo)
    const octokit = createClient()
    
    const exists = await octokit.repos.get({owner: owner, repo: repository})
    if (exists.status === 200) return

    const user = await octokit.users.getAuthenticated()
    if (user.data.login === owner) {
      await octokit.rest.repos.createForAuthenticatedUser({
        name: repository
      })  
    } else {
      await octokit.rest.repos.createInOrg({
        org: owner,
        name: repository,
      })
    }
  }
}

interface AddUserToRepoOptions {
  repo: string
  user: string
  permission: Permission 
}

export function addUserToRepo({repo, user, permission}: AddUserToRepoOptions) {
  return async () => {
    const [owner, repository] = split(repo)
    const octokit = createClient()
    await octokit.rest.repos.addCollaborator({
      owner: owner,
      repo: repository,
      username: user,
      permission: permission
    })
  }
}

interface AddTeamToRepoOptions {
  repo: string
  team: string
  permission: Permission 
}

export function addTeamToRepo({repo, team, permission}: AddTeamToRepoOptions) {
  return async () => {
    const [owner, _repo] = split(repo)
    const [org, _team] = split(team)
    const octokit = createClient()
    await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
      owner: owner, 
      repo: repo,
      org: org, 
      team_slug: _team,
      permission
    })
  }
}