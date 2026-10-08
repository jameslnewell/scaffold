import * as ejs from 'ejs';
import * as path from 'node:path';
import {type Content, DiskContent, Files} from '@buildscaffold/core/files';

const EXTENSION = '.ejs';

/** The values available to templates */
export type TemplateData = Record<string, unknown>;

/**
 * A new tree with each `.ejs` file rendered as an [EJS](https://ejs.co/) template and its `.ejs` extension removed
 * e.g. `package.json.ejs` becomes `package.json`.
 *
 * Values output with `<%= %>` aren't HTML escaped, since templates are usually code and config rather than HTML.
 * Templates loaded from disk can `include()` other templates relative to themselves. Other files are left as they
 * are, so binary files like images can sit alongside templates.
 *
 * @example
 * const rendered = await template(await fromDisk(`${import.meta.dirname}/templates`), {name: 'my-package'});
 */
export async function template(
  files: Files,
  data: TemplateData,
): Promise<Files> {
  const entries: Array<readonly [string, Content]> = [];
  // rendered one at a time, so a large tree of templates doesn't open more files at once than the OS allows
  for (const [file, content] of files) {
    if (!file.endsWith(EXTENSION) || path.posix.basename(file) === EXTENSION) {
      entries.push([file, content]);
      continue;
    }

    const rendered = file.slice(0, -EXTENSION.length);
    if (files.has(rendered)) {
      throw new Error(
        `Template "${file}" would replace "${rendered}", which is also in the tree`,
      );
    }

    const bytes =
      content instanceof Uint8Array ? content : await content.read();
    let text: string;
    try {
      text = ejs.render(new TextDecoder().decode(bytes), data, {
        // lets include() resolve relative to the template on disk
        filename: content instanceof DiskContent ? content.path : file,
        escape: String,
      });
    } catch (cause) {
      throw new Error(`Template "${file}" failed to render`, {cause});
    }
    entries.push([rendered, new TextEncoder().encode(text)]);
  }
  return new Files(entries);
}
