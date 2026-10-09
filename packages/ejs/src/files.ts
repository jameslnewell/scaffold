import * as ejs from 'ejs';
import * as path from 'node:path';
import {type File, Files, readText, writeText} from '@buildscaffold/core/files';
import {fileURLToPath} from 'node:url';

const EXTENSION = '.ejs';

/** The values available to templates */
export type TemplateData = Record<string, unknown>;

export interface TemplateFilesOptions {
  /**
   * The directory the templates were loaded from, so templates can `include()` other templates relative to
   * themselves. The templates' paths in the tree must still match their paths in the directory.
   */
  directory?: string | URL | undefined;
}

/**
 * A new tree with each `.ejs` file rendered as an [EJS](https://ejs.co/) template and its `.ejs` extension removed
 * e.g. `package.json.ejs` becomes `package.json`.
 *
 * Values output with `<%= %>` aren't HTML escaped, since templates are usually code and config rather than HTML.
 * Given the `directory` the templates were loaded from, templates can `include()` other templates relative to
 * themselves, as long as their paths in the tree still match their paths in the directory. Rendered files keep
 * their template's mode, so an executable template renders an executable file.
 * Other files are left as they are, so binary files like images can sit alongside templates.
 *
 * @example
 * const templates = new URL('../templates', import.meta.url);
 * const rendered = await template(await fromDisk(templates), {name: 'my-package'}, {directory: templates});
 */
export async function template(
  files: Files,
  data: TemplateData,
  {directory}: TemplateFilesOptions = {},
): Promise<Files> {
  const root = directory instanceof URL ? fileURLToPath(directory) : directory;
  const entries: Array<readonly [string, File]> = [];
  // rendered one at a time, so a large tree of templates doesn't open more files at once than the OS allows
  for (const [file, value] of files) {
    if (!file.endsWith(EXTENSION) || path.posix.basename(file) === EXTENSION) {
      entries.push([file, value]);
      continue;
    }

    const output = file.slice(0, -EXTENSION.length);
    if (files.has(output)) {
      throw new Error(
        `Template "${file}" would replace "${output}", which is also in the tree`,
      );
    }

    const [source, {mode}] = await Promise.all([
      readText(files, file),
      value.stat(),
    ]);
    let text: string;
    try {
      text = ejs.render(source ?? '', data, {
        // lets include() resolve relative to the template in its directory
        filename: root === undefined ? file : path.join(root, file),
        escape: String,
      });
    } catch (cause) {
      throw new Error(`Template "${file}" failed to render`, {cause});
    }
    // written to a tree of its own and collected, so the result is built once rather than copied for each file
    entries.push(...writeText(new Files(), output, text, {mode}));
  }
  return new Files(entries);
}
