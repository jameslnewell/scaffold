import type {Diff} from '@buildscaffold/core/diff';

export function printOptions(values: Record<string, unknown>): void {
  console.log('options:');
  for (const name of Object.keys(values).sort()) {
    console.log(`  ‣ ${name}=${String(values[name])}`);
  }
  console.log('');
}

export function printDiff(diff: Diff): void {
  console.log('changes:');
  for (const [file, {type}] of diff) {
    console.log(`  ‣ ${type.padEnd(6)} ${file}`);
  }
  if (diff.size === 0) {
    console.log('  ‣ none');
  }
  console.log('');
}
