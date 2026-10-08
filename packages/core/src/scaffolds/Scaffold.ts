import type {Files} from '../files/index.js';

/**
 * A scaffold receives the destination tree and returns the tree it should become.
 *
 * @example
 * const greet: Scaffold = (files) => writeText(files, 'greeting.txt', 'Hello!');
 */
export type Scaffold = (files: Files) => Files | Promise<Files>;
