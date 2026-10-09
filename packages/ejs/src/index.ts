import {type Files, fromDisk} from '@buildscaffold/core/files';
import {type MergeOptions, type Scaffold, merge} from '@buildscaffold/core';
import {type TemplateData, template as render} from './files.js';

export type {TemplateData} from './files.js';

export interface TemplateOptions extends MergeOptions {
  /**
   * The directory a tree of templates was loaded from, so they can `include()` other templates. Not needed when the
   * templates are given as a directory.
   */
  directory?: string | URL | undefined;
}

/**
 * A scaffold which renders each `.ejs` file in a directory (a path or `URL`) or a tree as an
 * [EJS](https://ejs.co/) template, removing the `.ejs` extension, and merges the result into the destination.
 * Other files are merged as they are.
 *
 * Existing files with the same path are replaced. Templates in a directory can `include()` other templates relative
 * to themselves, and rendered files keep their template's mode.
 *
 * @see the `template` operation in `@buildscaffold/ejs/files`
 * @example
 * template(new URL('../templates', import.meta.url), {name: 'my-package'})
 */
export function template(
  tree: Files | Promise<Files> | string | URL,
  data: TemplateData,
  {directory, ...options}: TemplateOptions = {},
): Scaffold {
  // a tree which fails to load is reported when the scaffold runs, rather than crashing the process with an
  // unhandled rejection before then
  if (tree instanceof Promise) tree.catch(() => undefined);
  return async (files) => {
    if (typeof tree === 'string' || tree instanceof URL) {
      const rendered = await render(await fromDisk(tree), data, {
        directory: tree,
      });
      return merge(rendered, options)(files);
    }
    return merge(await render(await tree, data, {directory}), options)(files);
  };
}
