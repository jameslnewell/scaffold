import type {Task} from '../types.js';
import {exec} from './exec.js';

// TODO: cwd option
// TODO: option to error if already inited
export function init(): Task {
  return exec('git', ['init']);
}

// TODO: cwd option
// TODO: option to specify files
export function add(): Task {
  return exec('git', ['add', '-A']);
}

// TODO: cwd option
// TODO: option to error if already exists
export function addRemote(): Task {
  // TODO:
  return exec('git', ['remote', 'add']);
}

// TODO: cwd option
export function commit(message: string): Task {
  // TODO:
  return exec('git', ['commit', '-m', message]);
}

// TODO: cwd option
export function push(): Task {
  // TODO:
  return exec('git', ['push']);
}
