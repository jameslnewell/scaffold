// node's spawn can't run commands like npm on Windows, which are .cmd shims requiring a shell, whereas
// cross-spawn resolves them and safely escapes their arguments
import spawn from "cross-spawn"

export interface ExecOptions {
  cwd?: string | undefined
}

export function exec(cmd: string, args: string[], {cwd}: ExecOptions = {}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {cwd})

    child.on('exit', (exitCode, signal) => {
      if (exitCode === 0) {
        resolve()
      } else {
        reject(new Error(`Process exited with exitCode=${String(exitCode)} signal=${String(signal)}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })

    child.stdout?.pipe(process.stdout)
    child.stderr?.pipe(process.stderr)

  })
}