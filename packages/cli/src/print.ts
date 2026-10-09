import type {Diff} from '@buildscaffold/core/diff';
import {styleText} from 'node:util';

// styleText() leaves the text plain when stdout isn't a TTY or colours are disabled e.g. with NO_COLOR
const style = (format: Parameters<typeof styleText>[0], text: string): string =>
  styleText(format, text, {stream: process.stdout});

const CHANGES = {
  create: {symbol: '+', format: 'green', summary: 'to create'},
  modify: {symbol: '~', format: 'yellow', summary: 'to overwrite'},
  delete: {symbol: '-', format: 'red', summary: 'to delete'},
} as const;

export function printOptions(values: Record<string, unknown>): void {
  if (Object.keys(values).length === 0) return;
  console.log('options:');
  for (const name of Object.keys(values).sort()) {
    console.log(`  ‣ ${name}=${String(values[name])}`);
  }
  console.log('');
}

export function printDiff(diff: Diff): void {
  console.log('changes:');
  const counts = {create: 0, modify: 0, delete: 0};
  for (const [file, {type}] of diff) {
    const {symbol, format} = CHANGES[type];
    console.log(style(format, `  ${symbol} ${file}`));
    ++counts[type];
  }
  if (diff.size === 0) {
    console.log('  none');
  } else {
    const summary = (['create', 'modify', 'delete'] as const)
      .filter((type) => counts[type] > 0)
      .map((type) => `${String(counts[type])} ${CHANGES[type].summary}`)
      .join(', ');
    console.log('');
    console.log(`  ${summary}`);
  }
  console.log('');
}

export function printTasks(labels: string[]): void {
  console.log('tasks:');
  for (const label of labels) {
    console.log(`  ‣ ${label}`);
  }
  console.log('');
}
