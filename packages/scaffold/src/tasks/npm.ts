
import type { Task } from "../types.js";
import { exec } from "./exec.js";

// TODO: cwd option
export function install(): Task {
  return exec('npm', ['install'])
}

// TODO: cwd option
export function run(script: string): Task {
  return exec('npm', ['run', script])
}