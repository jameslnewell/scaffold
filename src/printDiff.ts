import { VirtualFilesDiff } from "./createVirtualFiles.js"

export function printDiff(diff: VirtualFilesDiff) {
  console.log('diff:')
  for (const fileName of Object.keys(diff).sort()) {
    console.log(`  ‣ ${diff[fileName]} ${fileName}`)
  }
  console.log('')
}