import type {Files} from '../files/index.js';
import type {Scaffold} from './Scaffold.js';

/**
 * A scaffold which only runs the scaffold when the condition is true, and otherwise leaves the tree unchanged.
 *
 * @example
 * when((files) => !files.has('README.md'), write('README.md', '# My project'))
 */
export function when(
  condition: (files: Files) => boolean | Promise<boolean>,
  scaffold: Scaffold,
): Scaffold {
  return async (files) => ((await condition(files)) ? scaffold(files) : files);
}
