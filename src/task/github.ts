import { exec } from "./exec.js";

// TODO: option to error if already exists
export function createRepo() {
  // TODO:
  return exec({cmd: 'gh', args: ['repo', 'create']})
}

export function addUserToRepo() {
  // TODO:
  return exec({cmd: 'gh', args: ['repo', 'create']})
}

export function addTeamToRepo() {
  // TODO:
  return exec({cmd: 'gh', args: ['repo', 'create']})
}