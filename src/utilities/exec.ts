import { spawn } from "node:child_process"

export function exec(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args)

    child.on('exit', (exitCode, signal) => {
      if (exitCode === 0) {
        resolve()
      } else {
        reject(new Error(`Process exited with exitCode=${exitCode} signal=${signal}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

  })
}