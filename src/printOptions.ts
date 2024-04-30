import { ScaffoldOptions } from "./types.js"

export function printOptions(options: ScaffoldOptions<{}>) {
  console.log('options:')
  for (const key of Object.keys(options).sort()) {
    console.log(`  ‣ ${key}=${(options as any)[key]}`)
  }
  console.log('')
}