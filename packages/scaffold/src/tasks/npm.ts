
import { exec } from "./exec.js";

// TODO: cwd option
export function install() {
  return exec('npm', ['install'])
}

// TODO: cwd option
export function run(script: string) {
  return exec('npm', ['run', script])
}