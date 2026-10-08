import type { ScaffoldOptions, ScaffoldPrompts } from "./types.js"

export function printOptions(options: ScaffoldOptions<ScaffoldPrompts>): void {
  console.log('options:')
  for (const key of Object.keys(options).sort()) {
    console.log(`  ‣ ${key}=${String(options[key])}`)
  }
  console.log('')
}