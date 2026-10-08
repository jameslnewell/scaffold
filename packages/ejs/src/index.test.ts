import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  Files,
  isLazyContent,
  readText,
  writeText,
} from '@buildscaffold/core/files';
import {describe, expect, test} from 'vitest';
import {pathToFileURL} from 'node:url';
import {template} from './index.js';

describe(template, () => {
  test('merges the rendered tree into the destination', async () => {
    const templates = writeText(new Files(), 'README.md.ejs', '# <%= name %>');
    const destination = writeText(new Files(), 'other.txt', '');

    const files = await template(
      Promise.resolve(templates),
      {name: 'Bob'},
      {
        to: 'docs',
      },
    )(destination);

    expect(files.paths()).toEqual(['docs/README.md', 'other.txt']);
    await expect(readText(files, 'docs/README.md')).resolves.toBe('# Bob');
  });

  test.skipIf(process.platform === 'win32')(
    'renders the templates in a directory, keeping their modes',
    async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildscaffold-'));
      try {
        await fs.writeFile(path.join(dir, 'run.sh.ejs'), 'echo <%= name %>');
        await fs.chmod(path.join(dir, 'run.sh.ejs'), 0o755);

        const files = await template(pathToFileURL(dir), {name: 'Bob'})(
          new Files(),
        );

        await expect(readText(files, 'run.sh')).resolves.toBe('echo Bob');
        const content = files.get('run.sh');
        if (content === undefined || !isLazyContent(content)) {
          throw new Error('expected content with a mode');
        }
        expect((await content.stat()).mode).toBe(
          (await fs.stat(path.join(dir, 'run.sh.ejs'))).mode,
        );
      } finally {
        await fs.rm(dir, {recursive: true, force: true});
      }
    },
  );
});
