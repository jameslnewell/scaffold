import type {StagedFilesystemDiff} from './createStagedFiles.js';

export function printDiff(diff: StagedFilesystemDiff): void {
  console.log('diff:');
  for (const [fileName, status] of Object.entries(diff).sort(([a], [b]) =>
    a < b ? -1 : 1,
  )) {
    console.log(`  ‣ ${status} ${fileName}`);
  }
  console.log('');
}
