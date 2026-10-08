import type {Scaffold} from './Scaffold.js';

/**
 * A scaffold which passes the tree through each scaffold in order.
 *
 * @example
 * const scaffold = pipe(write('a.txt', 'a'), write('b.txt', 'b'));
 */
export function pipe(...scaffolds: Scaffold[]): Scaffold {
  return async (files) => {
    for (const scaffold of scaffolds) {
      files = await scaffold(files);
    }
    return files;
  };
}
