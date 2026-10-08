import {type MergeOptions, type Scaffold, merge} from '@buildscaffold/core';
import {type TemplateData, template as render} from './files.js';
import type {Files} from '@buildscaffold/core/files';

export type {TemplateData} from './files.js';

export type TemplateOptions = MergeOptions;

/**
 * A scaffold which renders each `.ejs` file in a tree as an [EJS](https://ejs.co/) template, removing the `.ejs`
 * extension, and merges the result into the destination. Other files are merged as they are.
 *
 * @see the `template` operation in `@buildscaffold/ejs/files`
 * @example
 * template(fromDisk(`${import.meta.dirname}/templates`), {name: 'my-package'})
 */
export function template(
  tree: Files | Promise<Files>,
  data: TemplateData,
  options: TemplateOptions = {},
): Scaffold {
  return merge(
    Promise.resolve(tree).then((files) => render(files, data)),
    options,
  );
}
