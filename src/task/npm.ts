
import { exec } from "./exec.js";

export function install() {
  return exec({cmd: 'npm', args: ['install']})
}