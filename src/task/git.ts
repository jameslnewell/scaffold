import { exec } from "./exec.js";

// TODO: option to error if already inited
export function init() {
  return exec({cmd: 'git', args: ['init']})
}

export function add() {
  // TODO:
  return exec({cmd: 'git', args: ['add']})
}

export function commit() {
  // TODO:
  return exec({cmd: 'git', args: ['commit']})
}

export function push() {
  // TODO:
  return exec({cmd: 'git', args: ['push']})
}

// TODO: option to error if already exists
export function addRemote() {
  // TODO:
  return exec({cmd: 'git', args: ['remote', 'add']})
}