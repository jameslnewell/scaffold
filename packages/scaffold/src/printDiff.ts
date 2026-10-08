import { StagedFilesystemDiff } from "./createStagedFiles.js"

export function printDiff(diff: StagedFilesystemDiff) {
  console.log('diff:')
  for (const fileName of Object.keys(diff).sort()) {
    console.log(`  ‣ ${diff[fileName]} ${fileName}`)
  }
  console.log('')
}